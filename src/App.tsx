// FILE: src/App.tsx
// Only the container width and grid spans changed.
import React from 'react';
import { InfoModal, UploadOverlay, SlidePanel, Notepad, FileList } from './components';
import { getCurrentEnv } from './lib/env';
import { listFiles } from './lib/idb';
import type { FileMeta } from './types';

export default function App() {
  const [files, setFiles] = React.useState<FileMeta[]>([]);
  const [refresh, setRefresh] = React.useState(0);
  const [infoOpen, setInfoOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  //const [selected, setSelected] = React.useState<GroupKey | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [env, setEnv] = React.useState<string>(getCurrentEnv());

  React.useEffect(() => {
    (async () => {
      const metas = await listFiles();
      metas.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setFiles(metas);
    })();
  }, [refresh, env]);

  const hasFiles = files.length > 0;

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="fixed inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            aria-label={panelOpen ? 'close panel' : 'open panel'}
            title={panelOpen ? 'close panel' : 'open panel'}
            onClick={() => setPanelOpen((v) => !v)}
            className="fixed px-2 py-1 left-3 top-3 z-40 flex h-8 w-auto items-center justify-center rounded-full font-bold text-slate-100 hover:bg-indigo-800"
          >
            {panelOpen ? '):' : env + ' (:' }
          </button>
        </div>
      </header>

      <main className="px-6 pb-24 pt-16">
        <section className="mx-auto w-full max-w-7xl">{/* wider page width */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className={hasFiles ? 'lg:col-span-6' : 'lg:col-span-12'}>{/* 6/6 split when files exist */}
              <Notepad env={env} onFilesUploaded={() => setRefresh((n) => n + 1)} />
            </div>

            {hasFiles && (
              <aside className="lg:col-span-6">
                <FileList refreshSignal={refresh} env={env}/>
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
        className="fixed bottom-6 right-6 z-40 flex h-8 w-8 items-center justify-center rounded-full text-2xl text-white shadow-lg hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
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
        open={panelOpen}
        group={null}
        files={files}
        onClose={() => setPanelOpen(false)}
        onFaq={() => setInfoOpen(true)}
        onEnvChange={(e) => { setEnv(e); setRefresh((n) => n + 1); }}
        onChanged={() => setRefresh((n) => n + 1)}
      />
    </div>
  );
}
