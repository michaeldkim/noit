// src/components/EmailModal.tsx
import React from 'react';
import DOMPurify from 'dompurify';
import type { ToDoValue } from '../types';
import { getAccessToken } from '../lib/gis';
import { listInbox, getMessageContent, type GmailMeta } from '../lib/gmail';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuggest: (v: ToDoValue) => void;
};

const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

export default function EmailModal({ open, onClose, onSuggest }: Props) {
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<GmailMeta[]>([]);
  const [sel, setSel] = React.useState<GmailMeta | null>(null);
  const [body, setBody] = React.useState<{ html: string; text: string }>({ html: '', text: '' });

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => closeRef.current?.focus(), 0);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) { setItems([]); setSel(null); setBody({ html: '', text: '' }); setToken(null); }
  }, [open]);

  async function connect() {
    setLoading(true);
    try {
      const t = await getAccessToken([SCOPE]);
      setToken(t);
      const metas = await listInbox(t, { q: '-category:{promotions social} newer_than:7d', maxResults: 25 });
      setItems(metas);
    } finally {
      setLoading(false);
    }
  }

  async function openMessage(m: GmailMeta) {
    if (!token) return;
    setSel(m);
    setLoading(true);
    try {
      setBody(await getMessageContent(token, m.id));
    } finally {
      setLoading(false);
    }
  }

  function addToTodo() {
    const title = (sel?.subject || sel?.snippet || 'email follow-up').slice(0, 120);
    const todo: ToDoValue = {
      title,
      priority: 'normal',
      due: '', // ToDoEditor will default to today if empty
      info: `from: ${sel?.from ?? ''}\n\n${body.text || ''}`,
    };
    onSuggest(todo);
    onClose();
  }

  const cleanHtml = body.html
    ? DOMPurify.sanitize(body.html, {
        USE_PROFILES: { html: true },          // no SVG/MathML
        FORBID_TAGS: [                         // remove active/remote vectors
          'a','img','iframe','object','embed','script','style','form','link','svg','math','video','audio'
        ],
        FORBID_ATTR: ['on*','style','srcset','ping'], // drop events & risky attrs
      })
    : null;
  const sanitized = cleanHtml ? { __html: cleanHtml } : null;

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="grid h-[80vh] w-[min(1100px,96vw)] grid-cols-[320px_1fr] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* header */}
        <div className="col-span-2 flex items-center justify-between border-b border-slate-800 px-3 py-2">
          <div className="font-semibold">gmail</div>
          <div className="flex items-center gap-2">
            {!token ? (
              <button onClick={connect} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700">
                connect gmail
              </button>
            ) : null}
            <button ref={closeRef} onClick={onClose} className="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-700">
              close
            </button>
          </div>
        </div>

        {/* list */}
        <aside className="min-h-0 overflow-y-auto border-r border-slate-800">
          {loading && items.length === 0 ? (
            <div className="p-3 text-xs text-slate-400">loading…</div>
          ) : !token ? (
            <div className="p-3 text-xs text-slate-400">click “connect gmail” to load your inbox (last 7 days, excluding promos/social).</div>
          ) : items.length === 0 ? (
            <div className="p-3 text-xs text-slate-400">no messages.</div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {items.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => openMessage(m)}
                    className="block w-full text-left px-3 py-2 hover:bg-slate-800/60 focus:bg-slate-800/60"
                    aria-label={`open email ${m.subject ?? ''}`}
                  >
                    <div className="truncate text-sm font-medium">{m.subject || '(no subject)'}</div>
                    <div className="truncate text-[11px] text-slate-400">{m.from}</div>
                    <div className="truncate text-[11px] text-slate-500">{m.snippet}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* reader */}
        <section className="min-h-0 overflow-y-auto p-4">
          {!sel ? (
            <div className="text-sm text-slate-400">select an email to preview.</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{sel.subject || '(no subject)'}</div>
                  <div className="text-xs text-slate-400">{sel.from}</div>
                </div>
                <button
                  onClick={addToTodo}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700"
                >
                  add to to-do
                </button>
              </div>
              {sanitized ? (
                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={sanitized} />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-slate-200">{body.text || '(no content)'}</pre>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}