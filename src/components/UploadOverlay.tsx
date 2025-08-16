// UploadOverlay.tsx
import React from 'react';
import DropZone from './DropZone';

type Props = {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void; // refresh parent after uploads
};

export default function UploadOverlay({ open, onClose, onUploaded }: Props) {
  const closeBtnRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between px-4 pt-3">
          <strong className="text-base">add files</strong>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="h-8 w-8 rounded-full font-bold px-2 py-1 text-sm hover:bg-indigo-800"
          >
            X
          </button>
        </div>
        <div className="p-5">
          {/* Reuse the dashed DropZone here */}
          <DropZone onUploaded={() => { onUploaded(); onClose(); }} />
        </div>
      </div>
    </div>
  );
}
