# Spec 002 - Obsidian Knowledge Workspace Generator

Status: superseded by [Spec 003](003-universal-mermaid-canvas-compiler.md).

Esta spec registra a etapa historica em que o projeto gerava arquivos Markdown automaticamente. Esse comportamento foi removido na Spec 003 para preservar o workflow nativo do Obsidian Canvas.

## Objetivo

Expandir o compilador para gerar um workspace Obsidian a partir de um arquivo Mermaid, com suporte a:

- CLI interativa
- output `.canvas` automatico
- modo `text`
- modo `pages`
- geracao de arquivos Markdown por node
- sanitizacao de nomes de arquivos
- preservacao de arquivos Markdown existentes

## Mudanca de entrada

O input principal passa a ser arquivo Mermaid puro:

- `.mmd`
- `.mermaid`

Arquivos `.md` continuam aceitos por compatibilidade com a Spec 001. Para Markdown, o primeiro bloco fenced `mermaid` e extraido.

## CLI

Execucao interativa:

```bash
node src/index.js
```

Perguntas:

```txt
Digite o caminho do arquivo Mermaid:
Escolha o modo de exportacao:
```

Modos:

- `text`: nodes de texto no Canvas
- `pages`: arquivos `.md` mais nodes `type: "file"` no Canvas

Tambem existe modo direto:

```bash
node src/index.js examples/roadmap.mmd text
node src/index.js examples/roadmap.mmd pages
```

## Regra de output

O `.canvas` e salvo automaticamente na mesma pasta do input.

```txt
examples/roadmap.mmd
↓
examples/roadmap.canvas
```

Extensoes removidas para gerar o nome:

- `.mmd`
- `.mermaid`
- `.md`

## Modo text

Cada node do Canvas usa:

```json
{
  "type": "text",
  "text": "Node label"
}
```

## Modo pages

Cada node gera um arquivo Markdown:

```txt
Node label.md
```

Conteudo inicial:

```md
# Node label
```

O Canvas usa:

```json
{
  "type": "file",
  "file": "Node label.md"
}
```

## Regra de overwrite

Arquivos Markdown existentes nao sao sobrescritos.

Se o arquivo ja existe, ele e preservado e o Canvas ainda aponta para esse arquivo.

## Sanitizacao

`sanitizeFilename(text)` remove caracteres invalidos para nomes de arquivo:

```txt
< > : " / \ | ? *
```

Emojis sao preservados.

## Modulos adicionados

- `src/cli/prompts.js`
- `src/exporter/markdownExporter.js`
- `src/parser/inputLoader.js`
- `src/utils/paths.js`
- `src/utils/sanitize.js`

## Pipeline

```txt
read CLI input
↓
load Mermaid or Markdown file
↓
extract Mermaid text
↓
parse Mermaid
↓
Graph IR
↓
apply layout
↓
choose export mode
├── text nodes
└── markdown pages
↓
generate canvas
↓
save .canvas
```

## Validacao esperada

```bash
npm run build
npm test
npm run example
```
