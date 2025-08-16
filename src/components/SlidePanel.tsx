// src/components/SlidePanel.tsx
import React from 'react';
import type { FileMeta } from '../types';
import { groupKey, groupLabel, typeLabel } from '../lib/fileTypes';
import type { GroupKey } from '../lib/fileTypes';
import { deleteFile, getFileBlob } from '../lib/idb';
import { getCurrentEnv, listEnvs, addEnv, setCurrentEnv, removeEnv, canDeleteEnv } from '../lib/env';
import { deleteAllInEnv } from '../lib/idb';
import { ConfirmModal } from '../components'

type Props = {
    open: boolean;
    group: GroupKey | null;
    files: FileMeta[];
    onClose: () => void;
    onChanged: () => void;
    onFaq?: () => void;
    onEnvChange?: (env: string) => void;
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

export default function SlidePanel({ open, group, files, onClose, onChanged, onFaq, onEnvChange }: Props) {
    const [envMenuOpen, setEnvMenuOpen] = React.useState(false);
    const [envs, setEnvs] = React.useState<string[]>(listEnvs());
    const [env, setEnv] = React.useState<string>(getCurrentEnv());
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const list = React.useMemo(() => files.filter(f => (group ? groupKey(f.type) === group : false)), [files, group]);
    const title = group ? groupLabel(group) : '';

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={onClose}
            />
            <aside
                className={`fixed left-0 top-0 z-50 flex h-full w-80 flex-col transform border-r border-slate-800 bg-slate-900 transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                    <div className="relative">
                        <button
                            onClick={() => setEnvMenuOpen((v) => !v)}
                            className="rounded-md px-2 py-1 text-sm font-semibold hover:bg-slate-800"
                            title="switch environment"
                        >
                            {env} ▾
                        </button>
                        {envMenuOpen && (
                            <div className="absolute left-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-md border border-slate-800 bg-slate-900 shadow-lg">
                                {envs.map((e) => (
                                    <button
                                        key={e}
                                        className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-800 ${e === env ? 'bg-slate-800' : ''}`}
                                        onClick={() => {
                                            setCurrentEnv(e);
                                            setEnv(e);
                                            setEnvMenuOpen(false);
                                            onEnvChange?.(e);
                                        }}
                                    >
                                        {e}
                                    </button>
                                ))}
                                <div className="h-px bg-slate-800" />
                                <button
                                    className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-800"
                                    onClick={() => {
                                        const name = prompt('add a page (environment name):', '');
                                        if (!name) return;
                                        const clean = name.trim().toLowerCase();
                                        if (!clean) return;
                                        addEnv(clean);
                                        setCurrentEnv(clean);
                                        setEnv(clean);
                                        setEnvs(listEnvs());
                                        setEnvMenuOpen(false);
                                        onEnvChange?.(clean);
                                    }}
                                >
                                    add a page
                                </button>
                                <button
                                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-800 ${!canDeleteEnv(env) ? 'cursor-not-allowed opacity-40' : ''}`}
                                    onClick={() => {
                                        if (!canDeleteEnv(env)) return;
                                        setEnvMenuOpen(false);
                                        setConfirmOpen(true);
                                    }}
                                >
                                    delete page
                                </button>
                            </div>
                        )}
                    </div>
                    <strong className="text-base">{title}</strong>
                    <button onClick={onClose} className="rounded-full px-2 py-1 font-bold hover:bg-indigo-800">close ):</button>
                </div>

                {/* scrollable content */}
                <div className="grid flex-1 gap-3 overflow-y-auto p-3">
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
                {/* footer with logo/title (left) and FAQ (right) */}
                <div className="mt-auto flex items-center justify-between border-t border-slate-800 px-3 py-2">
                    <strong className="text-md text-slate-300">noit: neural notework</strong>
                    <button
                        onClick={() => onFaq?.()}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 font-bold text-white hover:bg-indigo-800"
                        aria-label="FAQ / Info"
                        title="FAQ / Info"
                    >
                        ?
                    </button>
                </div>
            </aside>
            <ConfirmModal
                open={confirmOpen}
                title="delete page?"
                message={`this will permanently delete all notes and files in “${env}”. this cannot be undone.`}
                confirmLabel="delete"
                cancelLabel="cancel"
                onCancel={() => setConfirmOpen(false)}
                onConfirm={async () => {
                    setConfirmOpen(false);
                    await deleteAllInEnv(env);
                    removeEnv(env);
                    const next = getCurrentEnv(); // env.ts sets to 'main' if current removed
                    setEnv(next);
                    setEnvs(listEnvs());
                    onEnvChange?.(next);
                }}
            />
        </>
    );
}
