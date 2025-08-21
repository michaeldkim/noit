// src/components/ToDoList.tsx
import React from "react";
import { listNotesByKind } from "../lib/idb";

export type ToDoPriority = "high" | "normal" | "can-wait";
export type ToDoRow = {
  id: number;
  title: string;
  priority: ToDoPriority;
  due: string; // YYYY-MM-DD
  done?: boolean;
  rawBody?: string;
};

type Props = {
  env?: string;
  refreshSignal?: number;
  onSelect?: (item: ToDoRow) => void; // open in editor
  onToggleDone?: (id: number, next: boolean) => void; // optional persistence hook
};

function badge(pri: ToDoPriority) {
  switch (pri) {
    case "high":
      return "bg-rose-900/60 text-rose-100 border border-rose-800";
    case "can-wait":
      return "bg-slate-800 text-slate-200 border border-slate-700";
    default:
      return "bg-emerald-900/50 text-emerald-100 border border-emerald-800";
  }
}

export default function ToDoList({
  env,
  refreshSignal,
  onSelect,
  onToggleDone,
}: Props) {
  const [rows, setRows] = React.useState<ToDoRow[]>([]);

  async function load() {
    const notes = await listNotesByKind("to-do", env);
    const mapped: ToDoRow[] = notes.map((n: any) => {
      let body: any = {};
      try {
        body = n?.body ? JSON.parse(n.body) : {};
      } catch {
        body = {};
      }
      return {
        id: n.id,
        title: body.title ?? n.title ?? "(untitled)",
        priority: (body.priority as ToDoPriority) ?? "normal",
        due:
          typeof body.due === "string"
            ? body.due
            : new Date().toISOString().slice(0, 10),
        done: Boolean(body.done),
        rawBody: n.body ?? "",
      };
    });
    setRows(mapped);
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env, refreshSignal]);

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-lg border border-slate-800 bg-slate-950/40">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-sm">
        <span className="font-semibold">to-do</span>
        <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[11px]">
          {rows.length}
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto p-2">
        {rows.length === 0 ? (
          <div className="px-2 py-4 text-xs text-slate-400">no items yet.</div>
        ) : (
          <ul className="space-y-1">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-2 rounded-md border border-transparent px-2 py-1 hover:border-slate-700 hover:bg-slate-800/60"
              >
                <div className="flex items-center gap-4 w-[65%]">
                  {/* checkbox */}
                  <input
                    type="checkbox"
                    checked={Boolean(r.done)}
                    onChange={(e) =>
                      onToggleDone?.(r.id, e.currentTarget.checked)
                    }
                    className="h-4 w-4 accent-sky-600"
                    title="mark done"
                  />

                  {/* title / task */}
                  <span
                    className={
                      "inline-flex items-center leading-none truncate text-left text-sm basis-2/5 " +
                      (r.done
                        ? "text-slate-500 line-through"
                        : "text-slate-100")
                    }
                    onClick={() => onSelect?.(r)}
                    title={r.title}
                  >
                    {r.title}
                  </span>
                </div>
                <div className="flex items-center gap-4 w-[35%] justify-between">
                  {/* priority */}
                  <span
                    className={
                      "inline-flex w-20 items-center justify-center leading-none rounded px-2 py-0.5 text-xs basis-1/5" +
                      badge(r.priority)
                    }
                  >
                    {r.priority}
                  </span>

                  {/* due date */}
                  <span className="inline-flex items-center leading-none whitespace-nowrap text-sm text-slate-300 basis-1/5">
                    {r.due}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
