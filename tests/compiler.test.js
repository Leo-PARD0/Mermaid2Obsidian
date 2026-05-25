import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import {
  applyLayoutForGraph,
  compileWorkspace,
  detectDiagramType,
  exportToObsidianCanvas,
  applyLayout,
  extractMermaidFromInput,
  extractMermaidBlock,
  getCanvasOutputPath,
  parseMermaid,
  parseMermaidToGraph,
  resolveRelationships,
  sanitizeFilename
} from '../src/index.js';

test('compiles a Mermaid block from Markdown into Obsidian Canvas JSON', () => {
  const mermaidText = extractMermaidBlock(`
# Document

Some markdown content before the diagram.

\`\`\`mermaid
flowchart TD

A["Start"] --> B["Middle"]
B --> C["End"]
\`\`\`
`);
  const graph = parseMermaidToGraph(mermaidText);

  assert.deepEqual(
    graph.nodes.map((node) => node.id),
    ['A', 'B', 'C']
  );
  assert.deepEqual(graph.edges, [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' }
  ]);

  const positioned = applyLayout(graph);
  const canvas = exportToObsidianCanvas(positioned);

  assert.equal(canvas.nodes.length, 3);
  assert.equal(canvas.edges.length, 2);
  assert.equal(canvas.nodes[0].type, 'text');
  assert.equal(canvas.edges[0].fromSide, 'bottom');
  assert.equal(canvas.edges[0].toSide, 'top');
});

test('fails when Markdown has no mermaid block', () => {
  assert.throws(
    () => extractMermaidBlock('# Plain Markdown\n\nNo diagram here.'),
    /fenced mermaid code block/
  );
});

test('supports LR direction and reused labeled nodes', () => {
  const graph = parseMermaidToGraph(`
flowchart LR
A["Alpha"] --> B["Beta"] --> C["Gamma"]
A --> C
`);

  assert.equal(graph.direction, 'LR');
  assert.equal(graph.nodes.find((node) => node.id === 'A').text, 'Alpha');
  assert.equal(graph.edges.length, 3);

  const canvas = exportToObsidianCanvas(applyLayout(graph));
  assert.equal(canvas.edges[0].fromSide, 'right');
  assert.equal(canvas.edges[0].toSide, 'left');
});

test('parses flowchart subgraphs as semantic groups with node ownership', () => {
  const graph = parseMermaid(`
flowchart TD

subgraph F0 [📜 FASE 0]
  A[Teste<br>Linha] --> B[Final]
end
`);

  assert.equal(graph.groups.length, 1);
  assert.equal(graph.groups[0].id, 'F0');
  assert.equal(graph.groups[0].label, '📜 FASE 0');
  assert.deepEqual(graph.groups[0].children.nodes, ['A', 'B']);
  assert.equal(graph.nodes.find((node) => node.id === 'A').text, 'Teste\nLinha');
  assert.equal(graph.nodes.find((node) => node.id === 'A').parentGroup, 'F0');
});

test('exports Canvas groups before regular nodes', () => {
  const positioned = applyLayoutForGraph(parseMermaid(`
flowchart TD

subgraph F0 [📜 FASE 0]
  A --> B
end
`));
  const canvas = exportToObsidianCanvas(positioned, { mode: 'text' });

  assert.equal(canvas.nodes[0].type, 'group');
  assert.equal(canvas.nodes[0].label, '📜 FASE 0');
  assert.ok(canvas.nodes[0].width > 0);
  assert.equal(canvas.nodes[1].type, 'text');
});

test('resolves group relationships and exports semantic connector edges', () => {
  const graph = resolveRelationships(parseMermaid(`
flowchart TD

START --> F0
F0 --> F1

subgraph F0 [FASE 0]
  A --> B
end

subgraph F1 [FASE 1]
  C --> D
end
`));
  const positioned = applyLayoutForGraph(graph);
  const canvas = exportToObsidianCanvas(positioned, { mode: 'text' });

  assert.equal(graph.nodes.some((node) => node.id === 'F0'), false);
  assert.deepEqual(
    graph.semanticEdges.map((edge) => `${edge.from.type}:${edge.from.id}->${edge.to.type}:${edge.to.id}`),
    [
      'node:START->group:F0',
      'group:F0->group:F1'
    ]
  );
  assert.equal(graph.groups.find((group) => group.id === 'F0').outgoingGroups.includes('F1'), true);
  assert.ok(canvas.edges.some((edge) => edge.id.startsWith('semantic-edge')));
});


test('preserves nested subgraph hierarchy', () => {
  const graph = parseMermaid(`
flowchart TD

subgraph A [Grupo A]
  subgraph B [Grupo B]
    X --> Y
  end
end
`);

  const parent = graph.groups.find((group) => group.id === 'A');
  const child = graph.groups.find((group) => group.id === 'B');

  assert.equal(child.parentGroup, 'A');
  assert.deepEqual(parent.children.groups, ['B']);
  assert.deepEqual(child.children.nodes, ['X', 'Y']);
});

test('extracts Mermaid directly from .mmd input', () => {
  const mermaidText = extractMermaidFromInput('flowchart TD\nA --> B', 'roadmap.mmd');

  assert.equal(mermaidText, 'flowchart TD\nA --> B');
});

test('parses mindmaps as semantic hierarchical groups and leaf nodes', () => {
  const graph = parseMermaid(`
mindmap
  root((🧠 RE:ZERO<br>ARG))
    Linguística
      Subaru
    Astronomia
`);

  assert.equal(detectDiagramType('mindmap\n  root'), 'mindmap');
  assert.equal(graph.diagramType, 'mindmap');
  assert.equal(graph.edges.length, 0);
  assert.equal(graph.groups.find((group) => group.id === 'mindmap-root').label, '🧠 RE:ZERO\nARG');
  assert.equal(graph.groups.find((group) => group.label === 'Linguística').parentGroup, 'mindmap-root');
  assert.equal(graph.nodes.find((node) => node.text === 'Subaru').parentGroup, 'mindmap-0');
  assert.equal(graph.nodes.find((node) => node.text === 'Astronomia').parentGroup, 'mindmap-root');
});

test('lays out mindmaps with recursive nested group bounds', () => {
  const positioned = applyLayoutForGraph(parseMermaid(`
mindmap
  root
    child
      leaf
`));

  const root = positioned.groups.find((group) => group.label === 'root');
  const child = positioned.groups.find((group) => group.label === 'child');
  const leaf = positioned.nodes.find((node) => node.text === 'leaf');

  assert.ok(child.bounds.x > root.bounds.x);
  assert.ok(leaf.x > child.bounds.x);
  assert.ok(leaf.y > child.bounds.y);
  assert.ok(root.bounds.width > child.bounds.width);
  assert.ok(child.bounds.width > leaf.width);
});

test('extracts raw Mermaid from .md when no fenced block exists', () => {
  const mermaidText = extractMermaidFromInput('mindmap\n  root\n    child', 'input.md');

  assert.equal(mermaidText, 'mindmap\n  root\n    child');
});

test('derives canvas output path from supported input extensions', () => {
  assert.match(getCanvasOutputPath('examples/roadmap.mmd'), /roadmap\.canvas$/);
  assert.match(getCanvasOutputPath('examples/roadmap.mermaid'), /roadmap\.canvas$/);
  assert.match(getCanvasOutputPath('examples/roadmap.md'), /roadmap\.canvas$/);
});

test('sanitizes filenames while preserving emojis', () => {
  assert.equal(sanitizeFilename('⚡ ETAPA: 1?'), '⚡ ETAPA 1');
  assert.equal(sanitizeFilename('Teste\nLinha'), 'Teste Linha');
});

test('compiles file mode without creating Markdown files', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'mermaid2obsidian-'));

  try {
    const inputPath = join(outputDir, 'roadmap.mmd');

    await writeFile(
      inputPath,
      `flowchart TD

A["⚡ ETAPA 1"]
B["🧂 ETAPA 2"]

A --> B
`,
      'utf8'
    );

    const result = await compileWorkspace({
      inputPath,
      exportMode: 'file'
    });

    const canvas = JSON.parse(await readFile(result.canvasPath, 'utf8'));

    assert.equal(canvas.nodes[0].type, 'file');
    assert.equal(canvas.nodes[0].file, '⚡ ETAPA 1.md');
    assert.equal(canvas.edges.length, 1);
    await assert.rejects(access(join(outputDir, '⚡ ETAPA 1.md')));
    await assert.rejects(access(join(outputDir, '🧂 ETAPA 2.md')));
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

function centerOf(node) {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2
  };
}

function distance(left, right) {
  return Math.hypot(right.x - left.x, right.y - left.y);
}
