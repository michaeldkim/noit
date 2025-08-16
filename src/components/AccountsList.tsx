// FILE: src/components/AccountsList.tsx
import React from 'react';
import { listNotesByKind } from '../lib/idb';

export type AccountListItem = { id: number; title: string; body?: string; updatedAt?: string };

type Props = {
  env?: string;
  refreshSignal?: number;
  onSelect: (item: AccountListItem) => void;
};

export default function AccountsList({ env, refreshSignal, onSelect }: Props) {
  const [items, setItems] = React.useState<AccountListItem[]>([]);

  async function load() {
    const rows = await listNotesByKind('accounts', env);
    setItems(
      rows.map((n: any) => ({
        id: n.id,
        title: n.title || '(untitled)',
        body: n.body,
        updatedAt: n.updatedAt,
      }))
    );
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env, refreshSignal]);

  return (
    <aside className="rounded-lg border border-slate-800 bg-slate-950/40">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 text-sm">
        <span className="font-semibold">accounts</span>
        <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[11px]">{items.length}</span>
      </div>
      <div className="max-h-64 overflow-y-auto p-2">
        {items.length === 0 ? (
          <div className="px-2 py-4 text-xs text-slate-400">no accounts yet.</div>
        ) : (
          <ul className="space-y-1">
            {items.map((a) => (
              <li key={a.id}>
                <button
                  className="w-full truncate rounded-md border border-transparent px-2 py-1 text-left text-sm hover:border-slate-700 hover:bg-slate-800/60"
                  title={a.title}
                  onClick={() => onSelect(a)}
                >
                  {a.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
