export const EXPORT_MODES = {
  TEXT: 'text',
  FILE: 'file'
};

export function normalizeExportMode(mode = EXPORT_MODES.TEXT) {
  if (![EXPORT_MODES.TEXT, EXPORT_MODES.FILE].includes(mode)) {
    throw new Error('Modo invalido. Use "text" ou "file".');
  }

  return mode;
}
