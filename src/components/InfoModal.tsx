// InfoModal.tsx
import React from 'react';
import { ALLOWED_EXTS, MAX_FILE_SIZE_MB } from '../lib/fileTypes';
import { supportsOPFS } from '../lib/idb';

type Props = { open: boolean; onClose: () => void };

export default function InfoModal({ open, onClose }: Props) {
  const closeRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // steer focus for keyboard users
    const t = setTimeout(() => closeRef.current?.focus(), 0);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <strong className="text-base">faq</strong>
          <button
            ref={closeRef}
            onClick={onClose}
            className="h-7 w-7 rounded-full bg-slate-800 px-2 py-1 text-sm font-bold hover:bg-indigo-800"
          >
            <strong>X</strong>
          </button>
        </div>
        <div className="space-y-4 p-4 text-sm leading-relaxed">
          <div>
            <div className="mb-1 font-semibold">allowed file types?</div>
            <div className="flex flex-wrap gap-2">
              {ALLOWED_EXTS.map((e) => (
                <span key={e} className="rounded-md border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                  .{e}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 font-semibold">maximum size?</div>
            <p>{MAX_FILE_SIZE_MB} MB per file.</p>
          </div>
          <div>
            <div className="mb-1 font-semibold">where are files stored?</div>
            <p>
              files are saved <em>locally</em> in your browser:
              {supportsOPFS() ? ' OPFS (fast) with indexedDB fallback.' : ' indexedDB for blobs (OPFS not available).'}
              {' '}nothing leaves your device.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            tip: you can download or delete files anytime from the list below.
          </div>
        </div>
      </div>
    </div>
  );
}
