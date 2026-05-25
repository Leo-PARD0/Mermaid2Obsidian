const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g;
const RESERVED_WINDOWS_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

export function sanitizeFilename(text, fallback = 'untitled') {
  const sanitized = String(text ?? '')
    .replace(/\s+/g, ' ')
    .replace(INVALID_FILENAME_CHARS, '')
    .trim()
    .replace(/[. ]+$/g, '');

  if (!sanitized || RESERVED_WINDOWS_NAMES.test(sanitized)) {
    return fallback;
  }

  return sanitized;
}
