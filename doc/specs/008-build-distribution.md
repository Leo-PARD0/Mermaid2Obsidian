# Spec 008 - Build e Distribuição Windows

## Objetivo

Documentar o processo de build e distribuição do app Electron como instalador Windows, incluindo problemas encontrados durante a primeira compilação.

## Comando

```bash
npm run dist
```

Chama `electron-builder --win` e gera o instalador em `dist/`.

## Saída

```txt
dist/Mermaid2Obsidian Setup 0.1.0.exe
```

O instalador NSIS copia o app para:

```txt
C:\Users\<user>\AppData\Local\Programs\mermaid2obsidian\
```

E registra o app no menu Iniciar como `Mermaid2Obsidian`.

## Problema encontrado: `process.argv[1]` undefined no executável empacotado

**Sintoma:** ao rodar o instalador gerado, o app abria com o erro:

```
TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
at pathToFileURL (node:url:1024:3)
```

**Causa:** `src/index.js` usava a seguinte guarda para detectar execução via CLI:

```js
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli(process.argv.slice(2));
}
```

Quando o app roda empacotado pelo Electron, `process.argv[1]` é `undefined`. A chamada a `pathToFileURL(undefined)` lança o erro antes do app inicializar.

**Correção aplicada em `src/index.js`:**

```js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli(process.argv.slice(2));
}
```

A guarda `process.argv[1] &&` garante que o bloco CLI só executa quando há um `argv[1]`, ou seja, quando rodado via `node` diretamente. No Electron empacotado, o bloco é ignorado e o `compileWorkspace` é chamado normalmente via IPC.

## Comportamento do instalador NSIS

O arquivo `dist/Mermaid2Obsidian Setup 0.1.0.exe` é um instalador, não um executável portátil. Ao rodar pela primeira vez ele instala o app. As execuções seguintes são feitas pelo atalho do menu Iniciar ou pelo executável em:

```txt
C:\Users\<user>\AppData\Local\Programs\mermaid2obsidian\Mermaid2Obsidian.exe
```

## Alternativa portátil

Para gerar um executável que abre direto sem instalação, trocar o target no `package.json`:

```json
"win": {
  "target": "portable",
  "icon": "assets/Icon/Camada 5.ico",
  "forceCodeSigning": false
}
```

## Observação sobre assinatura de código

O `electron-builder` tenta assinar o executável com `signtool.exe`. Sem um certificado de assinatura configurado, isso pode falhar com erro de permissão para criar symbolic links no cache `winCodeSign`.

Solução: rodar o build como Administrador, ou adicionar `forceCodeSigning: false` no bloco `win` do `package.json` e limpar o cache:

```powershell
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
```