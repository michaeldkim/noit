// idb.ts
import type { FileMeta, Note } from '../types';
import { sniffMime } from './fileTypes';

const DB_NAME = 'note-graph';
const DB_VERSION = 3;
const META_STORE = 'files';
const BLOB_STORE = 'fileBlobs';
const NOTES_STORE = 'notes';

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

      if (!db.objectStoreNames.contains(META_STORE)) {
        const meta = db.createObjectStore(META_STORE, { keyPath: 'id', autoIncrement: true });
        meta.createIndex('createdAt', 'createdAt');
        meta.createIndex('name', 'name');
      }
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(NOTES_STORE)) {
        const notes = db.createObjectStore(NOTES_STORE, { keyPath: 'id', autoIncrement: true });
        notes.createIndex('kind', 'kind');
        notes.createIndex('updatedAt', 'updatedAt');
      }
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
  const normalizedType = sniffMime(file.name, file.type || undefined);
  const base = {
    name: file.name,
    type: normalizedType,
    size: file.size,
    lastModified: file.lastModified,
    createdAt: new Date().toISOString(),
    storage: supportsOPFS() ? ('opfs' as const) : ('idb' as const),
    location: ''
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
  const rows = await withReq<any[]>(db.transaction(META_STORE, 'readonly').objectStore(META_STORE).getAll());
  db.close();
  return rows as any;
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

// ---------- Notes API ----------
export async function saveNote(draft: Omit<Note, 'createdAt'|'updatedAt'> & { id?: number }): Promise<number> {
  const now = new Date().toISOString();
  const db = await openDB();
  const tx = db.transaction(NOTES_STORE, 'readwrite');
  const store = tx.objectStore(NOTES_STORE);

  if (draft.id) {
    const current = await withReq<any>(store.get(draft.id));
    const updated: Note = {
      ...(current ?? {}),
      ...draft,
      updatedAt: now,
      createdAt: current?.createdAt ?? now
    };
    await withReq(store.put(updated as any));
    await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
    db.close();
    return draft.id;
  } else {
    const toAdd: Note = { ...draft, createdAt: now, updatedAt: now };
    const idKey = await withReq<IDBValidKey>(store.add(toAdd as any));
    await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
    db.close();
    return Number(idKey as number);
  }
}
