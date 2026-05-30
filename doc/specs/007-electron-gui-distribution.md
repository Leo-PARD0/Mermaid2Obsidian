# Spec 007 - Electron GUI Distribution

## Objetivo

Empacotar o compilador como aplicativo Windows distribuível com interface gráfica mínima.

## Decisão principal

Usar Electron como camada de distribuição.

Motivo:

- `pkg` e `nexe` são incompatíveis com ESM + Node 22 (documentado em `compile_test.md`)
- Electron empacota o runtime Node junto, eliminando dependência de versão instalada
- `dialog.showOpenDialog()` nativo do Electron elimina dependência de `node-file-dialog` e seu `dialog.exe` externo
- O código em `src/` não precisa ser alterado

## Estado ao final desta spec

- `package.json` atualizado
- `electron/main.js` criado com referência a `preload.cjs`
- `electron/preload.cjs` criado em CommonJS
- `renderer/index.html` criado
- `npm start` abre a janela com UI funcional
- `npm run dist` gera o instalador Windows

## Alterações no package.json

Campo `main` alterado:

```json
"main": "electron/main.js"
```

Scripts adicionados:

```json
"start": "electron .",
"dist": "electron-builder --win"
```

Bloco `build` adicionado:

```json
"build": {
  "appId": "com.mermaid2obsidian.app",
  "productName": "Mermaid2Obsidian",
  "files": [
    "electron/**",
    "renderer/**",
    "src/**",
    "node_modules/**"
  ],
  "win": {
    "target": "nsis",
    "icon": "assets/Icon/Camada 5.ico"
  }
}
```

Dependências já presentes antes desta spec:

```json
"devDependencies": {
  "electron": "^42.3.0",
  "electron-builder": "^26.8.1"
}
```

## Estrutura de pastas

```txt
electron/
├── main.js
└── preload.cjs

renderer/
└── index.html
```

O diretório `src/` não é alterado.

## Arquivos

### electron/main.js

Processo principal do Electron.

Responsabilidades:

- criar a janela (`BrowserWindow`)
- expor `ipcMain.handle('select-file')` usando `dialog.showOpenDialog`
- expor `ipcMain.handle('compile')` chamando `compileWorkspace` de `src/index.js`

```js
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
```

### electron/preload.cjs

Ponte segura entre o processo principal e o renderer.

Expõe via `contextBridge`:

- `window.api.selectFile()`
- `window.api.compile({ inputPath, exportMode })`

Usa CommonJS (`.cjs`) porque o Electron carrega o preload em um contexto que não suporta ESM nativo, mesmo quando o `package.json` define `"type": "module"`. Com ESM, o `contextBridge.exposeInMainWorld` falha silenciosamente e `window.api` chega como `undefined` no renderer.

```js
// electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  compile: (args) => ipcRenderer.invoke('compile', args),
});
```

### renderer/index.html

Interface gráfica da janela.

Elementos:

- botão "Selecionar arquivo" → chama `window.api.selectFile()`
- display do caminho selecionado
- dropdown com opções `text` e `file`
- botão "Compilar" → chama `window.api.compile()`
- área de status com feedback de sucesso ou erro

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Mermaid2Obsidian</title>
  <style>
    body { font-family: sans-serif; padding: 32px; background: #1e1e2e; color: #cdd6f4; }
    h1 { font-size: 18px; margin-bottom: 24px; }
    button { cursor: pointer; padding: 8px 16px; border: none; border-radius: 6px; }
    #btn-select { background: #45475a; color: #cdd6f4; }
    #filepath { margin: 12px 0; font-size: 13px; color: #a6adc8; min-height: 18px; }
    select { padding: 8px; border-radius: 6px; background: #313244; color: #cdd6f4; border: none; }
    #btn-compile { background: #cba6f7; color: #1e1e2e; font-weight: bold; margin-top: 16px; display: block; width: 100%; padding: 12px; font-size: 15px; border-radius: 8px; }
    #status { margin-top: 20px; font-size: 14px; min-height: 20px; }
    .ok { color: #a6e3a1; }
    .err { color: #f38ba8; }
  </style>
</head>
<body>
  <h1>🧠 Mermaid → Obsidian Canvas</h1>

  <button id="btn-select">📂 Selecionar arquivo</button>
  <div id="filepath">Nenhum arquivo selecionado</div>

  <label for="mode">Modo de exportação:</label><br/>
  <select id="mode">
    <option value="text">text</option>
    <option value="file">file</option>
  </select>

  <button id="btn-compile">Compilar</button>
  <div id="status"></div>

  <script>
    let selectedPath = null;

    document.getElementById('btn-select').addEventListener('click', async () => {
      const p = await window.api.selectFile();
      if (p) {
        selectedPath = p;
        document.getElementById('filepath').textContent = p;
      }
    });

    document.getElementById('btn-compile').addEventListener('click', async () => {
      const status = document.getElementById('status');
      if (!selectedPath) {
        status.textContent = 'Selecione um arquivo primeiro.';
        status.className = 'err';
        return;
      }
      status.textContent = 'Compilando...';
      status.className = '';
      const result = await window.api.compile({
        inputPath: selectedPath,
        exportMode: document.getElementById('mode').value,
      });
      if (result.ok) {
        status.textContent = '✅ Canvas gerado com sucesso!';
        status.className = 'ok';
      } else {
        status.textContent = '❌ Erro: ' + result.error;
        status.className = 'err';
      }
    });
  </script>
</body>
</html>
```

## Problemas encontrados durante implementação

### 1. Pasta `render/` vs `renderer/`

**Problema:** a pasta foi criada como `render/` mas `main.js` chama `win.loadFile('renderer/index.html')`. O Electron não encontrava o arquivo e abria a janela em branco.

**Correção:** renomear a pasta de `render/` para `renderer/`.

### 2. `preload.js` ESM — `window.api` undefined

**Problema:** o preload original usava `import` ESM. O Electron carrega o preload em um contexto que não suporta ESM nativo, fazendo o `contextBridge.exposeInMainWorld` falhar silenciosamente. O renderer recebia `window.api` como `undefined` e os botões não funcionavam.

**Correção aplicada em duas etapas:**

1. Renomear `electron/preload.js` para `electron/preload.cjs` e converter para CommonJS.
2. Atualizar a referência no `main.js` de `preload.js` para `preload.cjs`.

## Pipeline de uso

```txt
npm start
↓
Electron abre janela
↓
Usuário clica "Selecionar arquivo"
↓
Explorer nativo do Windows abre
↓
Usuário seleciona .md ou .mmd
↓
Usuário escolhe modo (text / file)
↓
Usuário clica "Compilar"
↓
compileWorkspace() executa
↓
.canvas gerado na mesma pasta do input
↓
Janela exibe resultado
```

## Geração do instalador

```bash
npm run dist
```

Gera instalador `.exe` (NSIS) em:

```txt
dist/
```

## Ponto de atenção sobre ESM no main process

O projeto usa `"type": "module"`. O Electron respeita isso a partir da versão 28+ para o processo principal (`main.js`). O preload é uma exceção: mesmo com `"type": "module"` no `package.json`, o preload precisa ser CJS. A solução é usar extensão `.cjs` explícita, que o Node sempre trata como CJS independentemente do campo `type`.

## Fora do escopo desta spec

- ícone personalizado adicional além do `assets/Icon/Camada 5.ico` já referenciado
- assinatura de código do executável
- build para macOS ou Linux
- atualização automática