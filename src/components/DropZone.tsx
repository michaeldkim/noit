// DropZone.tsx
import React from 'react';
import { addFile } from '../lib/idb';
import { ALLOWED_ACCEPT, isAllowed } from '../lib/fileTypes';

export default function DropZone({ onUploaded }: { onUploaded: () => void }) {
  const [drag, setDrag] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string>('');
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  async function process(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    const files = Array.from(list);
    const ok = files.filter((f) => isAllowed(f.name, f.size).ok);
    const skipped = files.length - ok.length;
    for (const f of ok) await addFile(f);
    setMsg(`${ok.length} saved, ${skipped} skipped`);
    onUploaded();
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div
      className={[
        'rounded-2xl border-2 border-dashed p-6 text-center transition',
        'border-slate-600/60 bg-slate-900',
        drag ? 'ring-2 ring-sky-400/60 bg-slate-800' : ''
      ].join(' ')}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={async (e) => { e.preventDefault(); setDrag(false); await process(e.dataTransfer.files); }}
    >
      <div className="space-y-3">
        <div className="text-lg font-semibold">drag &amp; drop files</div>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-md hover:bg-slate-700 disabled:opacity-60 font-semibold"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? 'saving…' : 'choose files'}
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ALLOWED_ACCEPT}
            className="hidden"
            onChange={(e) => process(e.target.files)}
          />
        </div>
        {msg && <div className="text-xs text-slate-400">{msg}</div>}
      </div>
    </div>
  );
}