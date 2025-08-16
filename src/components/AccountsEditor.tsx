// src/components/AccountsEditor.tsx
// import React from 'react';

export type AccountsValue = {
  username: string;
  password: string;
  info: string;
};

type Props = {
  value: AccountsValue;
  onChange: (next: AccountsValue) => void;
};

export default function AccountsEditor({ value, onChange }: Props) {
  function set<K extends keyof AccountsValue>(k: K, v: AccountsValue[K]) {
    onChange({ ...value, [k]: v });
  }

  return (
    <div className="grid gap-3">
      <input
        type="text"
        value={value.username}
        onChange={(e) => set('username', e.target.value)}
        placeholder="username…"
        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
      />
      <input
        type="password"
        value={value.password}
        onChange={(e) => set('password', e.target.value)}
        placeholder="password…"
        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
      />
      <textarea
        value={value.info}
        onChange={(e) => set('info', e.target.value)}
        placeholder="additional information"
        rows={6}
        className="w-full resize-y rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
      />
    </div>
  );
}
