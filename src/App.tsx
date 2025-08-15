// FILE: src/App.tsx
// Only the container width and grid spans changed.
import React from 'react';
import { InfoModal, UploadOverlay, SlidePanel, Notepad, FileList } from './components';
import { listFiles } from './lib/idb';
import type { FileMeta } from './types';
import type { GroupKey } from './lib/fileTypes';

export default function App() {
  const [files, setFiles] = React.useState<FileMeta[]>([]);
  const [refresh, setRefresh] = React.useState(0);
  const [infoOpen, setInfoOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<GroupKey | null>(null);

  React.useEffect(() => {
    (async () => {
      const metas = await listFiles();
      metas.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setFiles(metas);
    })();
  }, [refresh]);

  const hasFiles = files.length > 0;

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <strong className="pointer-events-auto text-base font-semibold tracking-tight">
            noit: neural notework
          </strong>
          <button
            aria-label="FAQ / Info"
            title="FAQ / Info"
            onClick={() => setInfoOpen(true)}
            className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500"
          >
            ?
          </button>
        </div>
      </header>

      <main className="px-6 pb-24 pt-16">
        <section className="mx-auto w-full max-w-7xl">{/* wider page width */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className={hasFiles ? 'lg:col-span-6' : 'lg:col-span-12'}>{/* 6/6 split when files exist */}
              <Notepad onFilesUploaded={() => setRefresh((n) => n + 1)} />
            </div>

            {hasFiles && (
              <aside className="lg:col-span-6">
                <FileList refreshSignal={refresh} />
              </aside>
            )}
          </div>
        </section>

        {/* (optional) other sections below */}
      </main>

      <button
        aria-label="Add files"
        title="Add files"
        onClick={() => setUploadOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-2xl text-white shadow-lg hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
      >
        +
      </button>

      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      <UploadOverlay
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => setRefresh((n) => n + 1)}
      />
      <SlidePanel
        open={!!selected}
        group={selected}
        files={files}
        onClose={() => setSelected(null)}
        onChanged={() => setRefresh((n) => n + 1)}
      />
    </div>
  );
}
