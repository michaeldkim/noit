// FILE: src/App.tsx
// Only the container width and grid spans changed.
import React from "react";
import {
  InfoModal,
  UploadOverlay,
  SlidePanel,
  Notepad,
  FileList,
  GlobalSearchModal,
  AccountsList,
  ToDoList,
} from "./components";
import { getCurrentEnv } from "./lib/env";
import { listFiles, setTodoDone } from "./lib/idb";
import type { FileMeta, NoteKind, ToDoValue } from "./types";

export default function App() {
  const [files, setFiles] = React.useState<FileMeta[]>([]);
  const [refresh, setRefresh] = React.useState(0);
  const [accountsRefresh, setAccountsRefresh] = React.useState(0); // accounts list refresh
  const [noteKind, setNoteKind] = React.useState<NoteKind>("notes");
  const [prefillAccount, setPrefillAccount] = React.useState<{
    id?: number;
    title?: string;
    body?: string;
  }>();
  const [todoRefresh, setTodoRefresh] = React.useState(0);
  const [prefillTodo, setPrefillTodo] = React.useState<{
    id?: number;
    value: ToDoValue;
  }>();
  const [infoOpen, setInfoOpen] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  //const [selected, setSelected] = React.useState<GroupKey | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false); // slide panel toggle
  const [searchOpen, setSearchOpen] = React.useState(false); // ctrl+k
  const [env, setEnv] = React.useState<string>(getCurrentEnv());

  React.useEffect(() => {
    (async () => {
      const metas = await listFiles();
      metas.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setFiles(metas);
    })();
  }, [refresh, env]);

  // (ctrl + space) opens global search
  React.useEffect(() => {
    const DEBUG_KEYS = false; // set false to silence logs
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = (t?.tagName || "").toLowerCase();
      const isEditable =
        t?.isContentEditable === true || tag === "input" || tag === "textarea";
      if (DEBUG_KEYS)
        console.log("[hotkey]", {
          key: e.key,
          code: e.code,
          ctrl: e.ctrlKey,
          tag,
        });
      if (isEditable) return; // don't hijack while typing
      const key = (e.key || "").toLowerCase();
      const code = e.code;
      const isCtrlSpace =
        e.ctrlKey && (code === "Space" || key === " " || key === "spacebar");
      if (isCtrlSpace) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hasFiles = files.length > 0;

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 h-max">
      <header className="fixed inset-x-0 top-0 z-30">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            aria-label={panelOpen ? "close panel" : "open panel"}
            title={panelOpen ? "close panel" : "open panel"}
            onClick={() => setPanelOpen((v) => !v)}
            className="fixed px-2 py-1 left-3 top-3 z-40 flex h-8 w-auto items-center justify-center rounded-full font-bold text-slate-100 hover:bg-indigo-800"
          >
            {panelOpen ? "):" : env + " (:"}
          </button>
        </div>
        <div className="fixed  left-1/2 top-1.1 -translate-x-1/2 -translate-y-1/2">
          <button
            aria-label="open search"
            title="open search"
            onClick={() => setSearchOpen(true)}
            className="inline-flex items-center gap-2 font-bold rounded-md px-2.5 py-1.5 text-sm text-slate-100 hover:bg-slate-700 "
          >
            search?
            <kbd className="hidden sm:inline rounded border border-slate-600 bg-slate-900 px-1 text-[10px] leading-4 text-slate-300">
              ctrl + space
            </kbd>
          </button>
        </div>
      </header>

      <main className="px-6 pb-24 pt-16 h-full">
        <section className="mx-auto w-full">
          <div className="grid grid-cols-3 gap-6 px-10">
            {/* accounts list on the LEFT when accounts kind is active */}
            <div className="col-span-1 flex min-h-0 h-[calc(100vh-8rem)] flex-col gap-4">
              <div className="basis-1/3 min-h-0">
                <AccountsList
                  env={env}
                  refreshSignal={accountsRefresh}
                  onSelect={(a) => {
                    setNoteKind("accounts");
                    setPrefillAccount({
                      id: a.id,
                      title: a.title,
                      body: a.body,
                    });
                  }}
                />
              </div>
              <div className="basis-2/3 min-h-0">
                <ToDoList
                  env={env}
                  refreshSignal={todoRefresh}
                  onSelect={(row) => {
                    setNoteKind("to-do");
                    let val: ToDoValue = {
                      title: row.title,
                      priority: row.priority,
                      due: row.due,
                      info: "",
                      done: !!row.done,
                    };
                    try {
                      const parsed = row.rawBody ? JSON.parse(row.rawBody) : {};
                      val.info =
                        typeof parsed.info === "string" ? parsed.info : "";
                    } catch {}
                    setPrefillTodo({ id: row.id, value: val });
                  }}
                  onToggleDone={async (id, next) => {
                    await setTodoDone(id, next);
                    setTodoRefresh((n) => n + 1);
                  }}
                />
              </div>
            </div>
            {/* notepad column adjusts based on side panels */}
            <div className={"basis-1/3 "}>
              <Notepad
                env={env}
                kind={noteKind}
                onKindChange={setNoteKind}
                prefillAccount={prefillAccount}
                prefillTodo={prefillTodo}
                onFilesUploaded={() => setRefresh((n) => n + 1)}
                onSaved={(k) => {
                  if (k === "accounts") setAccountsRefresh((n) => n + 1);
                  if (k === "to-do") setTodoRefresh((n) => n + 1);
                }}
                onDeleted={() => {
                  setAccountsRefresh((n) => n + 1);
                  setPrefillAccount(undefined);
                }}
              />
            </div>

            {/* files list on the RIGHT when files exist */}
            {hasFiles && (
              <aside className={"basis-1/3"}>
                <FileList refreshSignal={refresh} env={env} />
              </aside>
            )}
          </div>
        </section>
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
        onEnvChange={(e) => {
          setEnv(e);
          setRefresh((n) => n + 1);
        }}
        onChanged={() => setRefresh((n) => n + 1)}
      />
      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}
