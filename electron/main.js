import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import { compileWorkspace } from '../src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    width: 520,
    height: 360,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });
  win.loadFile('renderer/index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('select-file', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'Mermaid / Markdown', extensions: ['md', 'mmd', 'mermaid'] }],
    properties: ['openFile'],
  });
  return filePaths[0] ?? null;
});

ipcMain.handle('compile', async (_event, { inputPath, exportMode }) => {
  try {
    await compileWorkspace({ inputPath, exportMode });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});