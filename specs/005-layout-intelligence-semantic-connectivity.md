# Spec 005 - Layout Intelligence and Semantic Group Connectivity

Status: partially superseded by [Spec 006](006-mindmap-hierarchy-spatial-engine.md) for mindmap layout.

The group relationship resolver remains active. The radial mindmap layout described here was replaced by hierarchy-first recursive layout in Spec 006.

## Objetivo

Resolver dois problemas:

- groups sem conectividade visual suficiente
- mindmaps com layout linear inadequado

## Decisao principal

Separar semântica de estratégia visual:

```txt
Mermaid
↓
Semantic Graph IR
↓
Relationship Resolver
↓
Layout Strategy Router
↓
Canvas Export
```

## Relationship Resolver

Modulo:

```txt
src/graph/relationshipResolver.js
```

Responsabilidades:

- detectar edges que envolvem groups
- remover nodes placeholder que representam IDs de subgraph
- preservar edges estruturais node -> node
- criar `semanticEdges`
- preencher `incomingGroups` e `outgoingGroups`

## Semantic Edges

Formato:

```js
{
  from: {
    type: 'group',
    id: 'F0',
    groupId: 'F0'
  },
  to: {
    type: 'group',
    id: 'F1',
    groupId: 'F1'
  }
}
```

Endpoints podem ser:

- `node`
- `group`

Casos suportados:

- `node -> group`
- `group -> group`
- `group -> node`
- inferência de relação group -> group a partir de edges node -> node entre groups diferentes

## Group Connectivity System

Obsidian Canvas nao possui edges nativas entre groups.

Solução inicial:

```txt
centroid-based virtual connector nodes
```

Para cada group, o exporter cria um node virtual minimo:

```json
{
  "type": "text",
  "text": "",
  "width": 1,
  "height": 1
}
```

Edges semânticas conectam:

```txt
node/group connector -> node/group connector
```

## Group Metadata

Groups passam a manter:

```js
{
  incomingGroups: [],
  outgoingGroups: []
}
```

Isso permite layouts futuros mais inteligentes.

## Mindmap Radial Layout

O layout de mindmap deixou de ser linear.

Novo comportamento:

- root no centro
- filhos distribuidos radialmente
- raio cresce por profundidade
- angulo e ponderado pelo tamanho da subtree

Objetivo:

```txt
       A
    B ROOT C
       D
```

## Export Order

Canvas continua respeitando:

```txt
groups
↓
regular nodes
↓
virtual connector nodes
↓
edges
```

No JSON Canvas, groups e connectors ainda vivem no array `nodes`, porque esse e o modelo do Obsidian Canvas.

## Modulos adicionados

- `src/graph/relationshipResolver.js`
- `src/graph/groupRelationshipBuilder.js`
- `src/graph/hierarchyResolver.js`

## Modulos alterados

- `src/exporter/obsidianCanvas.js`
- `src/layout/mindmapLayout.js`
- `src/index.js`
- `tests/compiler.test.js`

## Validacao

Casos cobertos por teste:

- resolver `node -> group`
- resolver `group -> group`
- remover placeholder node de group
- preencher `outgoingGroups`
- exportar semantic connector edges
- mindmap radial com distância crescente a partir do root

Comandos:

```bash
npm run build
npm test
npm run example
npm audit
```
