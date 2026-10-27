export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
];
export const FILE_ACCEPT = ALLOWED_MIME.join(',');

/** Same rules as the API; the server still checks the real bytes. */
export function validateFile(file: { type: string; size: number }): string | null {
  if (file.size === 0) return 'File is empty';
  if (file.size > MAX_UPLOAD_BYTES) return 'Max 10 MB';
  if (!ALLOWED_MIME.includes(file.type)) return 'File type not allowed';
  return null;
}

export const isImage = (mime: string) => mime.startsWith('image/');

export function attachmentName(url: string, mime: string): string {
  const last = decodeURIComponent(url.split('?')[0].split('/').pop() ?? '');
  return last || (mime === 'application/pdf' ? 'document.pdf' : 'file');
}

export function mimeLabel(mime: string): string {
  if (mime === 'application/pdf') return 'PDF';
  if (mime === 'text/plain') return 'Text';
  return mime.split('/')[1]?.toUpperCase() ?? 'File';
}
