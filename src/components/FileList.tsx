// FILE: src/components/FileList.tsx
import React from 'react';
import { deleteFile, getFileBlob, listFiles } from '../lib/idb';
import type { FileMeta } from '../types';
import { typeLabel } from '../lib/fileTypes';

function formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let n = bytes; let i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function FileList({ refreshSignal, env }: { refreshSignal: number; env?: string }) {
    const [files, setFiles] = React.useState<FileMeta[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [open, setOpen] = React.useState<Set<number>>(new Set());
    const [q, setQ] = React.useState('');
    const [typeFilter, setTypeFilter] = React.useState<string | null>(null);
    const [typesOpen, setTypesOpen] = React.useState(false);
    const typesBtnRef = React.useRef<HTMLButtonElement | null>(null);

    React.useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const metas = await listFiles();
                metas.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                setFiles(metas);
            } finally {
                setLoading(false);
            }
        })();
    }, [refreshSignal, env]);

    // available type labels (unique, sorted)
    const typeOptions = React.useMemo(() => {
        const s = new Set<string>();
        for (const f of files) s.add(typeLabel(f.type, f.name));
        return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, [files]);

    // live filter by query + type
    const filtered = React.useMemo(() => {
        const needle = q.trim().toLowerCase();
        return files.filter((f) => {
            const nameOk = !needle || f.name.toLowerCase().includes(needle);
            const tlabel = typeLabel(f.type, f.name);
            const typeOk = !typeFilter || tlabel === typeFilter;
            return nameOk && typeOk;
        });
    }, [files, q, typeFilter]);

    // close type menu on click outside / ESC
    React.useEffect(() => {
        if (!typesOpen) return;
        const onDoc = (e: MouseEvent) => {
            if (!typesBtnRef.current) return setTypesOpen(false);
            const root = typesBtnRef.current.parentElement;
            if (root && !root.contains(e.target as Node)) setTypesOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setTypesOpen(false);
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [typesOpen]);

    const isOpen = (id: number) => open.has(id);
    const toggle = (id: number) =>
        setOpen((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    async function download(id: number, name: string, type: string) {
        const blob = await getFileBlob(id);
        if (!blob) return;
        const finalBlob = blob.type ? blob : new Blob([blob], { type: type || 'application/octet-stream' });
        const url = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
    }

    async function openInNewTab(id: number, _name: string, type: string) {
        const blob = await getFileBlob(id);
        if (!blob) return;
        const url = URL.createObjectURL(blob.type ? blob : new Blob([blob], { type }));
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }

    async function remove(id: number) {
        await deleteFile(id);
        // reload after delete
        const metas = await listFiles();
        metas.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setFiles(metas);
    }

    return (
        <div className="flex h-[50vh] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-3 py-2">
                {/* LEFT: title + count + current type filter */}
                <div className="relative flex min-w-0 items-center gap-2">
                    <button
                        ref={typesBtnRef}
                        onClick={() => setTypesOpen((v) => !v)}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm font-semibold hover:bg-slate-800"
                        title="Filter by type"
                    >
                        files
                        <span className="rounded border border-slate-700 px-1.5 py-0.5 text-xs text-slate-300">
                            {files.length}
                        </span>
                        <span className="text-xs opacity-70">{typeFilter ? `• ${typeFilter}` : ''}</span>
                        <span className="text-xs opacity-60">▾</span>
                    </button>

                    {typesOpen && (
                        <div className="absolute left-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-md border border-slate-800 bg-slate-900 shadow-lg">
                            <button
                                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-800"
                                onClick={() => { setTypeFilter(null); setTypesOpen(false); }}
                            >
                                all files
                            </button>
                            <div className="h-px bg-slate-800" />
                            {typeOptions.map((t) => (
                                <button
                                    key={t}
                                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-800 ${t === typeFilter ? 'bg-slate-800' : ''}`}
                                    onClick={() => { setTypeFilter(t); setTypesOpen(false); }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT: fixed-size search (25% smaller) + reserved matches area */}
                <div className="flex flex-none items-center gap-2">
                    <span className="w-16 text-right text-xs text-slate-400">
                        {q ? `${filtered.length} match${filtered.length === 1 ? '' : 'es'}` : ''}
                    </span>
                    <div className="relative">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="search files…"
                            className="w-36 sm:w-[10.5rem] lg:w-48 rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
                        />
                        {q && (
                            <button
                                aria-label="Clear search"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded px-1 text-slate-300 hover:text-slate-100"
                                onClick={() => setQ('')}
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Scroll area */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4">Loading…</div>
                ) : (
                    <div className="grid gap-3 p-3">
                        {filtered.length === 0 && (
                            <div className="p-4 text-slate-400">
                                {q || typeFilter ? 'no matching files.' : 'no files yet.'}
                            </div>
                        )}

                        {filtered.map((f) => (
                            <article key={f.id} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                                {/* row: no justify-between; left grows, right stays inside */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* LEFT: flexible, can wrap; name truncates within width */}
                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                        <div className='flex flex-wrap w-full'>
                                            <strong className="truncate">{f.name}</strong>

                                        </div>
                                        <div className='flex w-full gap-2'>
                                            <span className="whitespace-nowrap rounded-md border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                                                {formatSize(f.size)}
                                            </span>
                                            <span className="whitespace-nowrap rounded-md border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                                                {typeLabel(f.type, f.name)}
                                            </span>
                                            <span className="whitespace-nowrap rounded-md border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                                                {new Date(f.createdAt).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="whitespace-nowrap rounded-md border border-slate-700 px-2 py-0.5 text-xs text-sky-300">
                                                {f.storage.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* RIGHT: actions; never push width; stays inside */}
                                    <div className="ml-auto flex shrink-0 items-center gap-2">
                                        {f.type.startsWith('application/pdf') && (
                                            <button
                                                className="whitespace-nowrap rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm hover:bg-slate-700"
                                                onClick={() => openInNewTab(f.id, f.name, f.type)}
                                            >
                                                open
                                            </button>
                                        )}
                                        {f.type.startsWith('text/') && (
                                            <button
                                                className="whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-sm hover:bg-slate-700"
                                                onClick={() => toggle(f.id)}
                                            >
                                                {isOpen(f.id) ? 'hide' : 'show'}
                                            </button>
                                        )}
                                        <button
                                            className="whitespace-nowrap rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm hover:bg-slate-700"
                                            onClick={() => download(f.id, f.name, f.type)}
                                        >
                                            download
                                        </button>
                                        <button
                                            className="whitespace-nowrap rounded-md border border-rose-900 bg-rose-950 px-2 py-1 text-sm text-rose-200 hover:bg-rose-900/40"
                                            onClick={() => remove(f.id)}
                                        >
                                            delete
                                        </button>
                                    </div>
                                </div>

                                {f.type.startsWith('text/') && isOpen(f.id) && <TextPreview id={f.id} />}
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function TextPreview({ id }: { id: number }) {
    const [text, setText] = React.useState<string>('');
    React.useEffect(() => {
        (async () => {
            const blob = await getFileBlob(id);
            if (!blob) return;
            try { const raw = await blob.text(); setText(raw.slice(0, 500)); } catch { }
        })();
    }, [id]);
    if (!text) return null;
    return <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-300/90">{text}</pre>;
}
