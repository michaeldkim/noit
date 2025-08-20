// src/components/AccountsEditor.tsx
import React from 'react';

export type AccountsValue = {
  username: string;
  password: string;
  info: string;
};

type Props = {
  value: AccountsValue;
  onChange: (next: AccountsValue) => void;
};
function IconEye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="1.8" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
    </svg>
  );
}
function IconEyeOff(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="1.8" d="M3 3l18 18" />
      <path strokeWidth="1.8" d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a16.6 16.6 0 0 1-3.05 3.95M6.1 6.1A16.8 16.8 0 0 0 2 12s3.5 7 10 7c1.6 0 3.06-.33 4.34-.9" />
      <path strokeWidth="1.8" d="M9.5 9.5a3 3 0 0 0 4 4" />
    </svg>
  );
}


export default function AccountsEditor({ value, onChange }: Props) {
  const [pwVisible, setPwVisible] = React.useState(false);
  const [copiedUser, setCopiedUser] = React.useState(false);
  const [copiedPass, setCopiedPass] = React.useState(false);

  function set<K extends keyof AccountsValue>(k: K, v: AccountsValue[K]) {
    onChange({ ...value, [k]: v });
  }

  async function copy(text: string, which: 'user' | 'pass') {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'user') {
        setCopiedUser(true);
        setTimeout(() => setCopiedUser(false), 1200);
      } else {
        setCopiedPass(true);
        setTimeout(() => setCopiedPass(false), 1200);
      }
    } catch {
      console.log('failed to copy')
    }
  }

  return (
    <div className="grid gap-3">
      <div className="relative">
        <input
          type="text"
          value={value.username}
          onChange={(e) => set('username', e.target.value)}
          placeholder="username…"
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 pr-20 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="button"
          onClick={() => copy(value.username, 'user')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-100 hover:bg-slate-700"
          aria-label="copy username"
          title="copy username"
        >
          {copiedUser ? 'copied!' : 'copy'}
        </button>
      </div>

      <div className="relative">
        <input
          type={pwVisible ? 'text' : 'password'}
          value={value.password}
          onChange={(e) => set('password', e.target.value)}
          placeholder="password…"
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 pr-28 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          <button
            type="button"
            onClick={() => setPwVisible((v) => !v)}
            className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-100 hover:bg-slate-700"
            aria-label={pwVisible ? 'hide password' : 'show password'}
            title={pwVisible ? 'hide password' : 'show password'}
          >
            {pwVisible ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => copy(value.password, 'pass')}
            className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-100 hover:bg-slate-700"
            aria-label="copy password"
            title="copy password"
          >
            {copiedPass ? 'copied!' : 'copy'}
          </button>
        </div>
      </div>

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
