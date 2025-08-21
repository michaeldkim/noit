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
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

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

    const safeCreds = (body?: string): { username: string; password: string } => {
    try {
      const o = body ? JSON.parse(body) : {};
      return {
        username: typeof o?.username === 'string' ? o.username : '',
        password: typeof o?.password === 'string' ? o.password : '',
      };
    } catch {
      return { username: '', password: '' };
    }
  };

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env, refreshSignal]);

    const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1200);
    } catch {
      /* ignore */
    }
  };

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
            {items.map((a) => {
              const { username, password } = safeCreds(a.body);
              const canCopyUser = username.trim().length > 0;
              const canCopyPass = password.length > 0;
              const keyUser = `${a.id}:user`;
              const keyPass = `${a.id}:pass`;

              return (
                <li key={a.id}>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex-1 truncate rounded-md border border-transparent px-2 py-1 text-left text-sm hover:border-slate-700 hover:bg-slate-800/60"
                      title={a.title}
                      onClick={() => onSelect(a)}
                    >
                      {a.title}
                    </button>

                    {/* copy username */}
                    <button
                      type="button"
                      disabled={!canCopyUser}
                      onClick={() => handleCopy(username, keyUser)}
                      className="inline-flex items-center text-xs justify-center rounded-md bg-slate-800 p-1.5 text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="copy username"
                      title={canCopyUser ? 'copy username' : 'no username'}
                    >
                      {copiedKey === keyUser ? (
                        'copied!'
                      ) : (
                        'copy username'
                      )}
                    </button>

                    {/* copy password */}
                    <button
                      type="button"
                      disabled={!canCopyPass}
                      onClick={() => handleCopy(password, keyPass)}
                      className="inline-flex items-center text-xs justify-center rounded-md bg-slate-800 p-1.5 text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="copy password"
                      title={canCopyPass ? 'copy password' : 'no password'}
                    >
                      {copiedKey === keyPass ? (
                        'copied!'
                      ) : (
                        'copy password'
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
