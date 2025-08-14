// App.tsx
import React from 'react';
import { DropZone, FileList, InfoModal } from './components';

export default function App() {
  const [refresh, setRefresh] = React.useState(0);
  const [infoOpen, setInfoOpen] = React.useState(false);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-slate-800 px-5 py-3">
          <strong className="text-lg">noit: neural notework</strong>
          <button
            aria-label="Upload information"
            title="Upload information"
            onClick={() => setInfoOpen(true)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            <strong>?</strong>
          </button>
        </div>

        <div className="space-y-4 px-5">
          <DropZone onUploaded={() => setRefresh((n) => n + 1)} />
          <div className="font-semibold text-lg">your stuff...</div>
          <FileList refreshSignal={refresh} />
        </div>

        <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      </div>
    </div>
  );
}
