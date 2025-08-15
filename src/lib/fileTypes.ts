// fileTypes.ts
export const MAX_FILE_SIZE_MB = 50;

export const EXT_TO_MIME: Record<string, string> = {
  txt: 'text/plain',
  md: 'text/markdown',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  rtf: 'application/rtf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  heic: 'image/heic'
};

export const ALLOWED_EXTS = Object.keys(EXT_TO_MIME);
export const ALLOWED_ACCEPT = ALLOWED_EXTS.map((e) => '.' + e).join(',');

function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/i);
  return m ? m[1] : '';
}

export function sniffMime(name: string, fallback: string | undefined): string {
  if (fallback && fallback !== '') return fallback;
  const ext = extOf(name);
  return EXT_TO_MIME[ext] ?? 'application/octet-stream';
}

export function isAllowed(name: string, size: number): { ok: true } | { ok: false; reason: string } {
  const ext = extOf(name);
  if (!ALLOWED_EXTS.includes(ext)) return { ok: false, reason: `.${ext || 'unknown'} not allowed` };
  if (size > MAX_FILE_SIZE_MB * 1024 * 1024) return { ok: false, reason: `> ${MAX_FILE_SIZE_MB} MB` };
  return { ok: true };
}

const MIME_TO_LABEL: Record<string, string> = {
  'text/plain': 'text',
  'text/markdown': 'markdown',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/rtf': 'rtf',
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/heic': 'heic',
  'application/octet-stream': 'binary'
};

export function typeLabel(mime: string | undefined, filename?: string): string {
  if (mime && MIME_TO_LABEL[mime]) return MIME_TO_LABEL[mime];
  if (mime?.startsWith('text/')) return 'text';
  if (mime?.startsWith('image/')) return 'image';
  if (mime?.startsWith('audio/')) return 'audio';
  if (mime?.startsWith('video/')) return 'video';
  if (mime?.startsWith('application/')) return 'document';
  const ext = filename ? extOf(filename) : '';
  return ext ? ext.toUpperCase() : 'file';
}

export type GroupKey = 'pdf' | 'image' | 'text' | 'word' | 'rtf' | 'other';

export function groupKey(mime: string | undefined): GroupKey {
  if (!mime) return 'other';
  if (mime.startsWith('application/pdf')) return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('text/')) return 'text';
  if (
    mime === 'application/msword' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) return 'word';
  if (mime === 'application/rtf') return 'rtf';
  return 'other';
}

export function groupLabel(key: GroupKey): string {
  return { pdf: 'pdfs', image: 'imgs', text: 'texts', word: 'docs', rtf: 'rtfs', other: 'other' }[key];
}

export function groupTone(key: GroupKey): { bg: string; ring: string } {
  // Tailwind utility class names
  switch (key) {
    case 'pdf':   return { bg: 'bg-red-600',     ring: 'ring-red-300/40' };
    case 'image': return { bg: 'bg-sky-600',     ring: 'ring-sky-300/40' };
    case 'text':  return { bg: 'bg-slate-600',   ring: 'ring-slate-300/40' };
    case 'word':  return { bg: 'bg-indigo-600',  ring: 'ring-indigo-300/40' };
    case 'rtf':   return { bg: 'bg-amber-600',   ring: 'ring-amber-300/40' };
    default:      return { bg: 'bg-violet-600',  ring: 'ring-violet-300/40' };
  }
}