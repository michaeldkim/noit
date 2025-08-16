// FILE: src/components/Notepad.tsx
import React from 'react';
import DropZone from './DropZone';
import AccountsEditor, { type AccountsValue } from './AccountsEditor';
import { saveNote } from '../lib/idb';
import type { NoteKind } from '../types';

type Props = {
    env?: string;
    onFilesUploaded?: () => void;
    kind: NoteKind;
    onKindChange: (k: NoteKind) => void;
    prefillAccount?: { title?: string; body?: string };
    onSaved?: (k: NoteKind) => void;
};

export default function Notepad({
    env,
    onFilesUploaded,
    kind,
    onKindChange,
    prefillAccount,
    onSaved,
}: Props) {
    const [title, setTitle] = React.useState('');
    const [body, setBody] = React.useState('');
    const [accounts, setAccounts] = React.useState<AccountsValue>({ username: '', password: '', info: '' });
    const [saving, setSaving] = React.useState(false);
    const [savedAt, setSavedAt] = React.useState<string | null>(null);

    // ensure DropZone receives a definite function
    const handleUploaded = React.useCallback(() => {
        onFilesUploaded?.();
    }, [onFilesUploaded]);

    const editor =
        kind === 'files'
            ? (<DropZone onUploaded={handleUploaded} />)
            : kind === 'accounts'
                ? (<AccountsEditor value={accounts} onChange={setAccounts} />)
                : (
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder={kind === 'to-do' ? 'things to do… (one per line works well)' : 'write something down…'}
                        className="h-64 w-full resize-y rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
                    />
                );

    async function onSave() {
        setSaving(true);
        try {
            const finalBody = kind === 'accounts' ? JSON.stringify(accounts) : body;
            await saveNote({ title, kind, body: finalBody }, env);
            setSavedAt(new Date().toLocaleTimeString());
            onSaved?.(kind);
        } finally {
            setSaving(false);
        }
    }

    React.useEffect(() => {
        if (kind !== 'accounts') setAccounts({ username: '', password: '', info: '' });
        if (kind !== 'notes' && kind !== 'to-do') setBody('');
    }, [kind]);

    // prefill from AccountsList selection
    React.useEffect(() => {
        if (!prefillAccount || kind !== 'accounts') return;
        if (prefillAccount.title) setTitle(prefillAccount.title);
        try {
            const parsed = prefillAccount.body ? JSON.parse(prefillAccount.body) : {};
            setAccounts({
                username: parsed.username ?? '',
                password: parsed.password ?? '',
                info: parsed.info ?? '',
            });
        } catch {
            setAccounts({ username: '', password: '', info: '' });
        }
    }, [prefillAccount, kind]);

    return (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="title"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
                />
                <label className="relative inline-block">
                    <select
                        value={kind}
                        onChange={(e) => onKindChange(e.target.value as NoteKind)}
                        className="appearance-none rounded-md border border-slate-700 bg-slate-950 px-3 py-2 pr-8 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                    >
                        <option value="notes">notes</option>
                        <option value="to-do">to-do</option>
                        <option value="accounts">accounts</option>
                        <option value="files">files</option>
                    </select>
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
                </label>
            </div>

            <div className="my-6 rounded-lg bg-slate-950/30 p-0.5">{editor}</div>

            <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{savedAt ? `saved ${savedAt}` : 'not saved yet'}</span>
                <button
                    onClick={onSave}
                    disabled={
                        saving ||
                        (kind !== 'files' &&
                            !title &&
                            !(kind === 'accounts' ? accounts.username || accounts.password || accounts.info : body))
                    }
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700 disabled:opacity-60"
                >
                    {saving ? 'saving…' : 'save'}
                </button>
            </div>
        </section>
    );
}
