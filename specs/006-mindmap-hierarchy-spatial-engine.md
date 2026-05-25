# Spec 006 - Mindmap Hierarchy Spatial Engine

## Objetivo

Refatorar o pipeline de `mindmap` para abandonar a arquitetura graph-first e passar a usar uma arquitetura hierarchy-first.

## Decisao principal

Mindmap nao e grafo simples.

Mindmap representa:

```txt
hierarquia semântica
```

Portanto:

- itens com children viram `group`
- itens sem children viram leaf nodes
- hierarchy vira containment espacial real
- edges Mermaid nao sao geradas para mindmap no MVP

## Pipeline

```txt
Mindmap Source
↓
Indentation Parser
↓
Hierarchy Builder
↓
Semantic Classifier
↓
Semantic Tree IR
↓
Graph IR com groups + leaf nodes
↓
Measure Pass
↓
Recursive Layout Pass
↓
Canvas Export
```

## Tree IR

```js
{
  root: {
    id,
    type,
    label,
    children: [],
    layout: {},
    metadata: {}
  }
}
```

Tipos:

- `root`
- `group`
- `file`
- `text`

No MVP, leaf nodes sao exportados como `file` ou `text` conforme o modo Canvas selecionado.

## Indentation Parser

Modulo:

```txt
src/parsers/mindmap/indentationParser.js
```

Responsabilidade:

- ignorar header `mindmap`
- remover comentarios Mermaid `%%`
- calcular indentacao
- normalizar labels
- converter `<br>` para `\n`

## Hierarchy Builder

Modulo:

```txt
src/parsers/mindmap/hierarchyBuilder.js
```

Responsabilidade:

- montar arvore via stack
- validar indentacao
- gerar `Tree IR`

Erro:

```txt
Invalid mindmap indentation at line <n>.
```

## Semantic Classifier

Modulo:

```txt
src/parsers/mindmap/semanticClassifier.js
```

Regra inicial:

```txt
root -> root
node with children -> group
leaf node -> file
```

## Measure Pass

Modulo:

```txt
src/layout/mindmap/measurePass.js
```

Bottom-up:

- medir leaf nodes
- medir grupos a partir dos filhos
- calcular `subtree width`
- calcular `subtree height`

## Layout Pass

Modulo:

```txt
src/layout/mindmap/layoutPass.js
```

Top-down:

- posicionar root group
- posicionar children dentro do parent
- respeitar padding/header/gap
- preservar nested bounds

## Canvas Export

O exporter existente continua sendo usado.

Mindmap agora chega ao exporter como:

```js
{
  groups: [],
  nodes: [],
  edges: []
}
```

Groups sao exportados como:

```json
{
  "type": "group",
  "label": "A"
}
```

Leaf nodes sao exportados conforme modo:

```json
{
  "type": "file",
  "file": "leaf.md"
}
```

ou:

```json
{
  "type": "text",
  "text": "leaf"
}
```

## Testes

Casos cobertos:

- mindmap gera groups para itens com children
- leaf nodes recebem `parentGroup`
- mindmap nao gera edges no MVP
- bounds aninhados sao calculados
- profundidade variavel funciona no layout recursivo

## Validacao

```bash
npm run build
npm test
npm run example
npm audit
```
