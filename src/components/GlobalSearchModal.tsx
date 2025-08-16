// src/components/GlobalSearchModal.tsx
import React from 'react';
import type { FileMeta } from '../types';
import { searchFilesGlobal, getFileBlob } from '../lib/idb';
import { typeLabel } from '../lib/fileTypes';

type Props = {
  open: boolean;
  onClose: () => void;
};

function formatSize(bytes: number): string {
  const u = ['B', 'KB', 'MB', 'GB']; let n = bytes, i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
}

export default function GlobalSearchModal({ open, onClose }: Props) {
  const [q, setQ] = React.useState('');
  const [results, setResults] = React.useState<FileMeta[]>([]);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  // close with Esc
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return;
    let keep = true;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchFilesGlobal(q, 50);
        if (keep) setResults(r);
      } finally {
        if (keep) setLoading(false);
      }
    }, 200); // debounce
    return () => { keep = false; clearTimeout(id); };
  }, [q, open]);

  async function openInNewTab(id: number, _name: string, type: string) {
    const blob = await getFileBlob(id);
    if (!blob) return;
    const url = URL.createObjectURL(blob.type ? blob : new Blob([blob], { type }));
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function download(id: number, name: string, type: string) {
    const blob = await getFileBlob(id); if (!blob) return;
    const b = blob.type ? blob : new Blob([blob], { type: type || 'application/octet-stream' });
    const url = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60" onClick={onClose} />
      <div className="fixed inset-0 z-[60] grid place-items-start p-6 pt-20">
        <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="border-b border-slate-800 p-3">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="search files across all pages (ctrl + space)…"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-3">
            {loading ? (
              <div className="p-3 text-slate-300">searching…</div>
            ) : results.length === 0 ? (
              <div className="p-3 text-slate-400">{q ? 'no matches.' : 'type to search.'}</div>
            ) : (
              <div className="grid gap-2">
                {results.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 p-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate text-sm font-semibold">{f.name}</span>
                      <span className="whitespace-nowrap rounded border border-slate-700 px-1.5 py-0.5 text-[11px] text-slate-300">
                        {typeLabel(f.type, f.name)}
                      </span>
                      <span className="whitespace-nowrap rounded border border-slate-700 px-1.5 py-0.5 text-[11px] text-slate-300">
                        {formatSize(f.size)}
                      </span>
                      <span className="whitespace-nowrap rounded border border-slate-700 px-1.5 py-0.5 text-[11px] text-slate-300">
                        {new Date(f.createdAt).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="ml-auto whitespace-nowrap rounded border border-slate-700 px-1.5 py-0.5 text-[11px] text-sky-300">
                        {String((f as any).env ?? 'main')}
                      </span>
                    </div>
                    {f.type?.startsWith('application/pdf') && (
                      <button
                        className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                        onClick={() => openInNewTab(f.id, f.name, f.type)}
                      >
                        open
                      </button>
                    )}
                    <button
                      className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                      onClick={() => download(f.id, f.name, f.type)}
                    >
                      download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-slate-800 p-2">
            <button
              onClick={onClose}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm hover:bg-indigo-800"
            >
              esc
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
