// FileList.tsx
import React from 'react';
import { deleteFile, getFileBlob, listFiles } from '../lib/idb';
import type { FileMeta } from '../types';

function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes; let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function FileList({ refreshSignal }: { refreshSignal: number }) {
  const [files, setFiles] = React.useState<FileMeta[]>([]);
  const [loading, setLoading] = React.useState(true);

  async function load() {
    setLoading(true);
    try {
      const metas = await listFiles();
      metas.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setFiles(metas);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, [refreshSignal]);

  async function download(id: number, name: string, type: string) {
    const blob = await getFileBlob(id);
    if (!blob) return;
    const finalBlob = blob.type ? blob : new Blob([blob], { type: type || 'application/octet-stream' });
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  async function openInNewTab(id: number, name: string, type: string) {
    const blob = await getFileBlob(id);
    if (!blob) return;
    const url = URL.createObjectURL(blob.type ? blob : new Blob([blob], { type }));
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function remove(id: number) {
    await deleteFile(id);
    await load();
  }

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="grid gap-3 p-3">
      {files.length === 0 && (
        <div className="text-center p-4 text-slate-400">no files yet? drop some above!</div>
      )}
      {files.map((f) => (
        <article key={f.id} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="truncate">{f.name}</strong>
              <span className="rounded-md border border-slate-700 px-2 py-0.5 text-xs text-slate-300">{formatSize(f.size)}</span>
              <span className="rounded-md border border-slate-700 px-2 py-0.5 text-xs text-slate-300">{f.type || 'unknown'}</span>
              <span className="rounded-md border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                {new Date(f.createdAt).toLocaleString()}
              </span>
              <span className="rounded-md border border-slate-700 px-2 py-0.5 text-xs text-sky-300">
                {f.storage.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {f.type.startsWith('application/pdf') && (
                <button className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm hover:bg-slate-700"
                  onClick={() => openInNewTab(f.id, f.name, f.type)}>
                  Open
                </button>
              )}
              <button className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm hover:bg-slate-700"
                onClick={() => download(f.id, f.name, f.type)}>
                Download
              </button>
              <button className="rounded-md border border-rose-900 bg-rose-950 px-2 py-1 text-sm text-rose-200 hover:bg-rose-900/40"
                onClick={() => remove(f.id)}>
                Delete
              </button>
            </div>
          </div>

          {f.type.startsWith('text/') && <TextPreview id={f.id} />}
          {f.type.startsWith('image/') && <ImagePreview id={f.id} alt={f.name} />}
        </article>
      ))}
    </div>
  );
}

function TextPreview({ id }: { id: number }) {
  const [text, setText] = React.useState<string>('');
  React.useEffect(() => { (async () => {
    const blob = await getFileBlob(id); if (!blob) return;
    try { const raw = await blob.text(); setText(raw.slice(0, 500)); } catch {}
  })(); }, [id]);
  if (!text) return null;
  return <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-300/90">{text}</pre>;
}

function ImagePreview({ id, alt }: { id: number; alt: string }) {
  const [url, setUrl] = React.useState<string>('');
  React.useEffect(() => { (async () => {
    const blob = await getFileBlob(id); if (!blob) return;
    const u = URL.createObjectURL(blob); setUrl(u);
    return () => URL.revokeObjectURL(u);
  })(); }, [id]);
  if (!url) return null;
  return <img src={url} alt={alt} className="mt-2 max-h-40 rounded-md border border-slate-800 object-contain" />;
}
