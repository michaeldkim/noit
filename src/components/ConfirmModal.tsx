// FILE (NEW): src/components/ConfirmModal.tsx
import React from 'react';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  counts?: { files: number, notes: number };
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'confirm',
  cancelLabel = 'cancel',
  onConfirm,
  onCancel,
  busy=false,
  counts,
}: Props) {
  const cancelRef = React.useRef<HTMLButtonElement | null>(null);
  const confirmRef = React.useRef<HTMLButtonElement | null>(null);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    setTimeout(() => confirmRef.current?.focus(), 0);

    function onKeydown(e: KeyboardEvent) {
      if (!open) return;
      if (busy) {
        if (e.key === 'Escape' || e.key === 'Enter') {e.preventDefault(); onCancel(); return; }
      } else {
        if (e.key === 'Escape') { e.preventDefault(); onCancel(); return; }
        if (e.key === 'Enter') { e.preventDefault(); onConfirm(); return; }
      }
      if (e.key !== 'Tab') return;

      // trap tab within modal
      const focusables = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[];
      if (focusables.length === 0) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !dialogRef.current?.contains(active)) {
          e.preventDefault(); last.focus();
        }
      } else {
        if (active === last || !dialogRef.current?.contains(active)) {
          e.preventDefault(); first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKeydown);
    return () => {
      document.removeEventListener('keydown', onKeydown);
      // restore focus
      prev?.focus();
    };
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onCancel} />
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          aria-busy={busy}
          className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-xl"
        >
          <div id={titleId} className="mb-2 text-base font-semibold">{title}</div>
          <p id={descId} className="mb-4 text-sm text-slate-300">{message}</p>
          {counts && (
            <div className="mb-4 text-xs text-slate-400">
              files: <span className="font-semibold text-slate-300">{counts.files}</span>
              {' '}• notes: <span className="font-semibold text-slate-300">{counts.notes}</span>
              {' '}• total: <span className="font-semibold text-slate-300">{counts.files + counts.notes}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              ref={cancelRef}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700"
              onClick={onCancel}
              disabled={busy}
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              className="rounded-md border border-rose-900 bg-rose-950 px-3 py-1.5 text-sm text-rose-200 hover:bg-rose-900/40"
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? 'deleting...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
