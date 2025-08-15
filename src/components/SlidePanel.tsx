// src/components/SlidePanel.tsx
import React from 'react';
import type { FileMeta } from '../types';
import { groupKey, groupLabel, typeLabel } from '../lib/fileTypes';
import type { GroupKey } from '../lib/fileTypes';
import { deleteFile, getFileBlob } from '../lib/idb';

type Props = {
  open: boolean;
  group: GroupKey | null;
  files: FileMeta[];
  onClose: () => void;
  onChanged: () => void; // refresh after delete
};

function formatSize(bytes: number): string {
  const u = ['B', 'KB', 'MB', 'GB']; let n = bytes, i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
}

async function download(id: number, name: string, type: string) {
  const blob = await getFileBlob(id); if (!blob) return;
  const b = blob.type ? blob : new Blob([blob], { type: type || 'application/octet-stream' });
  const url = URL.createObjectURL(b);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

async function openInNewTab(id: number, _name: string, type: string) {
  const blob = await getFileBlob(id); if (!blob) return;
  const url = URL.createObjectURL(blob.type ? blob : new Blob([blob], { type }));
  window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function SlidePanel({ open, group, files, onClose, onChanged }: Props) {
  const list = React.useMemo(() => files.filter(f => (group ? groupKey(f.type) === group : false)), [files, group]);
  const title = group ? groupLabel(group) : '';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-80 transform border-r border-slate-800 bg-slate-900 transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <strong className="text-base">{title}</strong>
          <button onClick={onClose} className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm hover:bg-slate-700">close</button>
        </div>
        <div className="grid gap-3 overflow-y-auto p-3">
          {list.length === 0 && <div className="p-3 text-sm text-slate-400">No files.</div>}
          {list.map(f => (
            <div key={f.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-sm font-semibold leading-tight">{f.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                <span className="rounded border border-slate-700 px-1.5 py-0.5">{formatSize(f.size)}</span>
                <span className="rounded border border-slate-700 px-1.5 py-0.5">{typeLabel(f.type, f.name)}</span>
                <span className="rounded border border-slate-700 px-1.5 py-0.5">{new Date(f.createdAt).toLocaleString()}</span>
                <div className="ml-auto flex items-center gap-2">
                  {f.type.startsWith('application/pdf') && (
                    <button className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700" onClick={() => openInNewTab(f.id, f.name, f.type)}>open</button>
                  )}
                  <button className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700" onClick={() => download(f.id, f.name, f.type)}>download</button>
                  <button
                    className="rounded-md border border-rose-900 bg-rose-950 px-2 py-1 text-xs text-rose-200 hover:bg-rose-900/40"
                    onClick={async () => { await deleteFile(f.id); onChanged(); }}
                  >delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
