import React from 'react';
import { saveNote } from '../lib/idb';
import type { NoteKind } from '../types';
import DropZone from './DropZone';

const KINDS: { value: NoteKind; label: string }[] = [
  { value: 'notes',    label: 'Notes' },
  { value: 'todo',     label: 'To-do' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'files',    label: 'Files' }
];

export default function Notepad({ onFilesUploaded }: { onFilesUploaded?: () => void }) {
  const [title, setTitle] = React.useState('');
  const [kind, setKind] = React.useState<NoteKind>('notes');
  const [body, setBody] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  async function onSave() {
    setSaving(true);
    try {
      const now = new Date().toLocaleTimeString();
      await saveNote({ title, kind, body });
      setSavedAt(now);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 sm:max-w-sm"
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as NoteKind)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 sm:w-auto"
        >
          {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
      </div>

      {kind === 'files' ? (
        <div className="mb-4">
          {/* why: lets Notepad trigger refresh in App when files are added */}
          <DropZone onUploaded={() => onFilesUploaded?.()} />
        </div>
      ) : (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            kind === 'notes' ? 'Write something down…'
            : kind === 'todo' ? 'Things to do… (one per line works well)'
            : 'Add details…'
          }
          rows={10}
          className="mb-4 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
        />
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400">
          {savedAt ? `Saved ${savedAt}` : 'Not saved yet'}
        </div>
        <button
          onClick={onSave}
          disabled={saving || (!title && kind !== 'files' && !body)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}