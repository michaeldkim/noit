// idb.ts
import type { FileMeta, Note } from '../types';
import { sniffMime } from './fileTypes';
import { getCurrentEnv } from './env';

const DB_NAME = 'note-graph';
const DB_VERSION = 4;
const META_STORE = 'files';
const BLOB_STORE = 'fileBlobs';
const NOTES_STORE = 'notes';

// idempotent index creation (avoids @ts-expect-error on DOMStringList.contains)
function ensureIndex(
  store: IDBObjectStore,
  name: string,
  keyPath: string | string[],
  options?: IDBIndexParameters
) {
  try { store.createIndex(name, keyPath as any, options); } catch { /* exists */ }
}

function withReq<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      let meta: IDBObjectStore;
      if (!db.objectStoreNames.contains(META_STORE)) {
        meta = db.createObjectStore(META_STORE, { keyPath: 'id', autoIncrement: true });
      } else {
        meta = req.transaction!.objectStore(META_STORE);
      }
      ensureIndex(meta, 'createdAt', 'createdAt');
      ensureIndex(meta, 'name', 'name');
      ensureIndex(meta, 'env', 'env', { unique: false });

      // blobs store
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE, { keyPath: 'id' });
      }

      // notes
      let notes: IDBObjectStore;
      if (!db.objectStoreNames.contains(NOTES_STORE)) {
        notes = db.createObjectStore(NOTES_STORE, { keyPath: 'id', autoIncrement: true });
      } else {
        notes = req.transaction!.objectStore(NOTES_STORE);
      }
      ensureIndex(notes, 'kind', 'kind');
      ensureIndex(notes, 'updatedAt', 'updatedAt');
      ensureIndex(notes, 'env', 'env', { unique: false });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---- OPFS helpers ----
let opfsDirPromise: Promise<any> | null = null;
export function supportsOPFS(): boolean {
  const ns: any = navigator as any;
  return !!(ns?.storage && typeof ns.storage.getDirectory === 'function');
}
async function getOPFSDir(): Promise<any> {
  if (!supportsOPFS()) throw new Error('OPFS not supported');
  if (!opfsDirPromise) {
    const ns: any = navigator as any;
    opfsDirPromise = (async () => {
      const root = await ns.storage.getDirectory();
      return await root.getDirectoryHandle('blobs', { create: true });
    })();
  }
  return opfsDirPromise;
}
async function writeOPFSFile(id: number, file: File): Promise<string> {
  const dir = await getOPFSDir();
  const fh = await dir.getFileHandle(String(id), { create: true });
  const w = await fh.createWritable();
  await w.write(file);
  await w.close();
  return `blobs/${id}`;
}
async function readOPFSFile(id: number): Promise<Blob> {
  const dir = await getOPFSDir();
  const fh = await dir.getFileHandle(String(id));
  const f = await fh.getFile();
  return f;
}
async function deleteOPFSFile(id: number): Promise<void> {
  const dir = await getOPFSDir();
  await dir.removeEntry(String(id), { recursive: false });
}

// ---- Public API ----
export interface AddResult { id: number }

export async function addFile(file: File): Promise<AddResult> {
  const env = getCurrentEnv();
  const normalizedType = sniffMime(file.name, file.type || undefined);
  const base = {
    name: file.name,
    type: normalizedType,
    size: file.size,
    lastModified: file.lastModified,
    createdAt: new Date().toISOString(),
    storage: supportsOPFS() ? ('opfs' as const) : ('idb' as const),
    location: '',
    env
  };

  const db1 = await openDB();
  const idKey = await withReq<IDBValidKey>(db1.transaction(META_STORE, 'readwrite').objectStore(META_STORE).add(base as any));
  const id = Number(idKey as number);
  db1.close();

  if (base.storage === 'opfs') {
    try {
      const loc = await writeOPFSFile(id, file);
      const db2 = await openDB();
      await withReq(db2.transaction(META_STORE, 'readwrite').objectStore(META_STORE).put({ ...base, id, location: loc } as any));
      db2.close();
      return { id };
    } catch {
      // fallback to IDB
    }
  }

  const db3 = await openDB();
  const tx3 = db3.transaction([META_STORE, BLOB_STORE], 'readwrite');
  await withReq(tx3.objectStore(BLOB_STORE).put({ id, blob: file } as any));
  await withReq(tx3.objectStore(META_STORE).put({ ...base, id, storage: 'idb', location: `idb:${id}` } as any));
  await new Promise<void>((res, rej) => {
    tx3.oncomplete = () => res();
    tx3.onerror = () => rej(tx3.error);
    tx3.onabort = () => rej(tx3.error);
  });
  db3.close();
  return { id };
}

export async function listFiles(): Promise<FileMeta[]> {
  const db = await openDB();
  const env = getCurrentEnv();
  const tx = db.transaction(META_STORE, 'readonly');
  const store = tx.objectStore(META_STORE);
  try {
    const idx = store.index('env');
    const rows = await withReq<any[]>(idx.getAll(env));
    db.close();
    return rows as any;
  } catch {
    const rows = await withReq<any[]>(store.getAll());
    db.close();
    return (rows as any).filter((r: any) => (r.env ?? 'main') === env);
  }
}

export async function getFileMeta(id: number): Promise<FileMeta | null> {
  const db = await openDB();
  const row = await withReq<any>(db.transaction(META_STORE, 'readonly').objectStore(META_STORE).get(id));
  db.close();
  return (row ?? null) as any;
}

export async function getFileBlob(id: number): Promise<Blob | null> {
  const meta = await getFileMeta(id);
  if (!meta) return null;
  if (meta.storage === 'opfs') {
    try { return await readOPFSFile(id); } catch { }
  }
  const db = await openDB();
  const rec = await withReq<any>(db.transaction(BLOB_STORE, 'readonly').objectStore(BLOB_STORE).get(id));
  db.close();
  return rec?.blob ?? null;
}

export async function deleteFile(id: number): Promise<void> {
  const meta = await getFileMeta(id);
  if (meta?.storage === 'opfs') {
    try { await deleteOPFSFile(id); } catch { }
  } else {
    const dbb = await openDB();
    await withReq(dbb.transaction(BLOB_STORE, 'readwrite').objectStore(BLOB_STORE).delete(id));
    dbb.close();
  }
  const db = await openDB();
  await withReq(db.transaction(META_STORE, 'readwrite').objectStore(META_STORE).delete(id));
  db.close();
}

// hard-delete everything in an environment (files + blobs + notes)
export async function deleteAllInEnv(env: string): Promise<void> {
  // collect file ids in this env
  const db = await openDB();
  const metas = (await withReq<any[]>(
    db.transaction(META_STORE, 'readonly').objectStore(META_STORE).getAll()
  )) as any[];
  db.close();
  const targets = metas.filter((m) => (m.env ?? 'main') === env);

  // delete OPFS blobs first (outside of IDB tx)
  for (const m of targets) {
    if (m.storage === 'opfs') {
      try { await deleteOPFSFile(m.id); } catch {}
    }
  }

  // delete idb blobs + meta in one tx
  const db2 = await openDB();
  const tx2 = db2.transaction([META_STORE, BLOB_STORE], 'readwrite');
  const blobStore = tx2.objectStore(BLOB_STORE);
  const metaStore = tx2.objectStore(META_STORE);
  for (const m of targets) {
    if (m.storage === 'idb') { try { blobStore.delete(m.id); } catch {} }
    try { metaStore.delete(m.id); } catch {}
  }
  await new Promise<void>((res, rej) => { tx2.oncomplete = () => res(); tx2.onerror = () => rej(tx2.error); tx2.onabort = () => rej(tx2.error); });
  db2.close();

  // delete notes in this env
  const db3 = await openDB();
  const notes = await withReq<any[]>(db3.transaction(NOTES_STORE, 'readonly').objectStore(NOTES_STORE).getAll());
  const noteIds = notes.filter((n) => (n.env ?? 'main') === env).map((n) => n.id);
  db3.close();
  if (noteIds.length) {
    const db4 = await openDB();
    const tx4 = db4.transaction(NOTES_STORE, 'readwrite');
    const ns = tx4.objectStore(NOTES_STORE);
    for (const id of noteIds) { try { ns.delete(id); } catch {} }
    await new Promise<void>((res, rej) => { tx4.oncomplete = () => res(); tx4.onerror = () => rej(tx4.error); tx4.onabort = () => rej(tx4.error); });
    db4.close();
  }
}
// counts for confirm modal (no env index yet, filter in-memory)
export async function countTotalsInEnv(env: string): Promise<{ files: number; notes: number }> {
  const db = await openDB();
  const tx1 = db.transaction(META_STORE, 'readonly');
  const s1 = tx1.objectStore(META_STORE);
  let files = 0;
  try { files = await withReq<number>(s1.index('env').count(env)); }
  catch {
    const all = await withReq<any[]>(s1.getAll());
    files = all.filter((m) => (m.env ?? 'main') === env).length;
  }
  const tx2 = db.transaction(NOTES_STORE, 'readonly');
  const s2 = tx2.objectStore(NOTES_STORE);
  let notes = 0;
  try { notes = await withReq<number>(s2.index('env').count(env)); }
  catch {
    const all = await withReq<any[]>(s2.getAll());
    notes = all.filter((n) => (n.env ?? 'main') === env).length;
  }
  db.close();
  return { files, notes };
}
// list notes of a given kind within an env (used for accounts sidebar)
export async function listNotesByKind(kind: string, env?: string) {
  const db = await openDB();
  const tx = db.transaction(NOTES_STORE, 'readonly');
  const store = tx.objectStore(NOTES_STORE);
  try {
    const rows = await withReq<any[]>(store.index('kind').getAll(kind));
    db.close();
    return (rows as any).filter((n: any) => (env ? (n.env ?? 'main') === env : true));
  } catch {
    const rows = await withReq<any[]>(store.getAll());
    db.close();
    return (rows as any).filter(
      (n: any) => n.kind === kind && (env ? (n.env ?? 'main') === env : true)
    );
  }
}
// global search (all envs) by filename substring
export async function searchFilesGlobal(q: string, limit = 50): Promise<FileMeta[]> {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const db = await openDB();
  const store = db.transaction(META_STORE, 'readonly').objectStore(META_STORE);
  const rows = await withReq<any[]>(store.getAll());
  db.close();
  return (rows as any)
    .filter((r: any) => (r.name ?? '').toLowerCase().includes(needle))
    .sort((a: any, b: any) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, limit);
}
// ---------- Notes API ----------
export async function saveNote(
  draft: Omit<Note, 'createdAt'|'updatedAt'> & { id?: number },
  env?: string
): Promise<number> {
  const now = new Date().toISOString();
  const currEnv = (env ?? getCurrentEnv());
  const db = await openDB();
  const tx = db.transaction(NOTES_STORE, 'readwrite');
  const store = tx.objectStore(NOTES_STORE);

  if (draft.id) {
    const current = await withReq<any>(store.get(draft.id));
    const updated: Note = {
      ...(current ?? {}),
      ...draft,
      updatedAt: now,
      createdAt: current?.createdAt ?? now,
      env: currEnv
    };
    await withReq(store.put(updated as any));
    await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
    db.close();
    return draft.id;
  } else {
    const toAdd: Note = { ...draft, createdAt: now, updatedAt: now, env: currEnv };
    const idKey = await withReq<IDBValidKey>(store.add(toAdd as any));
    await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
    db.close();
    return Number(idKey as number);
  }
}
