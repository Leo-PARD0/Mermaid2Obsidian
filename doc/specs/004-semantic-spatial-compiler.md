# Spec 004 - Semantic Spatial Compiler

## Objetivo

Transformar o compilador em uma camada semântica espacial capaz de preservar:

- hierarquia
- containers
- agrupamentos
- relações espaciais
- estrutura conceitual

## Decisao principal

`subgraph` Mermaid deve virar `type: "group"` no Obsidian Canvas.

Mapeamento oficial:

| Mermaid | Canvas |
|---|---|
| node | node |
| edge | edge |
| subgraph | group |
| nested subgraph | nested groups |
| hierarchy | spatial containment |

## Semantic Graph IR

O IR passa a conter:

```js
{
  nodes: [],
  edges: [],
  groups: [],
  metadata: {
    diagramType
  }
}
```

## Group IR

```js
{
  id,
  label,
  parentGroup,
  children: {
    nodes: [],
    groups: []
  },
  bounds: {
    x,
    y,
    width,
    height
  }
}
```

Groups nao possuem edges. Eles organizam e preservam semântica.

## Subgraph parsing

Sintaxe suportada:

```mermaid
subgraph F0 [📜 FASE 0]
  A --> B
end
```

Resultado:

```js
{
  id: 'F0',
  label: '📜 FASE 0'
}
```

Tambem ha suporte inicial para:

```mermaid
subgraph Linguistica
  Subaru --> Kanji
end
```

## Scope stack

O parser de flowchart usa `groupStack`:

- `subgraph`: cria group e faz push
- `end`: faz pop
- node dentro do escopo recebe `parentGroup`

Erros:

- `Unexpected end without subgraph.`
- `Unclosed subgraph: <id>`

## Node ownership

Nodes dentro de um subgraph recebem:

```js
{
  parentGroup: 'F0'
}
```

O group tambem registra:

```js
children: {
  nodes: ['A', 'B'],
  groups: []
}
```

## Chained edges

Continua suportado:

```mermaid
A --> B --> C
```

Resultado:

```txt
A -> B
B -> C
```

## HTML labels

`<br>` e `<br/>` viram `\n`.

```mermaid
A[Texto<br>Linha]
```

Resultado:

```txt
Texto
Linha
```

## Group layout

Depois do layout dos nodes:

1. localizar children do group
2. calcular bounding box
3. aplicar padding
4. salvar em `group.bounds`

Formula:

```txt
group.x = minX - padding
group.y = minY - padding
group.width = maxX - minX + padding*2
group.height = maxY - minY + padding*2
```

## Canvas export

Groups sao exportados no array `nodes` do Canvas:

```json
{
  "type": "group",
  "label": "FASE 0",
  "x": 0,
  "y": 0,
  "width": 1000,
  "height": 800
}
```

Regra: groups sao exportados antes dos nodes comuns.

## Modulos adicionados

- `src/graph/nodeFactory.js`
- `src/graph/edgeFactory.js`
- `src/graph/groupFactory.js`
- `src/layout/groupLayout.js`

## Validacao

Comandos:

```bash
npm run build
npm test
npm run example
npm audit
```
