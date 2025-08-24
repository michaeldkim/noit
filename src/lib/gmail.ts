// src/lib/gmail.ts
const API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const AUTH = (t: string) => ({ Authorization: `Bearer ${t}` });

export type GmailMeta = {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string; // ms since epoch (string from API)
  from?: string;
  subject?: string;
};

export async function listInbox(token: string, opts?: { q?: string; maxResults?: number }): Promise<GmailMeta[]> {
  const q = opts?.q ?? '';
  const max = String(opts?.maxResults ?? 20);
  const r = await fetch(`${API}/messages?maxResults=${max}&q=${encodeURIComponent(q)}`, {
    headers: AUTH(token),
  });
  const data = await r.json();
  const ids: string[] = (data.messages ?? []).map((m: any) => m.id);
  const metas: GmailMeta[] = [];
  for (const id of ids) {
    const r2 = await fetch(
      `${API}/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&fields=id,threadId,internalDate,snippet,payload/headers`,
      { headers: AUTH(token) }
    );
    const d2 = await r2.json();
    const headers = Object.fromEntries((d2.payload?.headers ?? []).map((h: any) => [h.name.toLowerCase(), h.value]));
    metas.push({
      id: d2.id,
      threadId: d2.threadId,
      snippet: d2.snippet ?? '',
      internalDate: String(d2.internalDate ?? ''),
      from: headers['from'] ?? '',
      subject: headers['subject'] ?? '',
    });
  }
  return metas;
}

function walkParts(parts: any[]): { html?: string; text?: string } {
  let out: { html?: string; text?: string } = {};
  for (const p of parts ?? []) {
    const mime: string = p.mimeType || '';
    const data: string = p.body?.data ? atob(String(p.body.data).replace(/-/g, '+').replace(/_/g, '/')) : '';
    if (mime === 'text/html' && data) out.html = data;
    else if (mime === 'text/plain' && data) out.text = data;
    if ((!out.html || !out.text) && p.parts) {
      const deeper = walkParts(p.parts);
      out = { ...out, ...deeper };
    }
  }
  return out;
}

export async function getMessageContent(token: string, id: string): Promise<{ html: string; text: string }> {
  const r = await fetch(`${API}/messages/${id}?format=full`, { headers: AUTH(token) });
  const d = await r.json();
  const payload = d.payload ?? {};
  if (payload.body?.data) {
    const data = atob(String(payload.body.data).replace(/-/g, '+').replace(/_/g, '/'));
    const isHtml = (payload.mimeType ?? '').includes('html');
    return { html: isHtml ? data : '', text: isHtml ? '' : data };
  }
  const res = walkParts(payload.parts ?? []);
  return { html: res.html ?? '', text: res.text ?? '' };
}