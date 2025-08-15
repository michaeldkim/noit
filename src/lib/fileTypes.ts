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