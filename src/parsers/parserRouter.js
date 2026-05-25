import { parseFlowchart } from './flowchart/flowchartParser.js';
import { parseMindmap } from './mindmap/mindmapParser.js';

const DIAGRAM_HEADERS = [
  ['flowchart', /^(flowchart|graph)\b/i],
  ['mindmap', /^mindmap\b/i],
  ['sequenceDiagram', /^sequenceDiagram\b/i],
  ['journey', /^journey\b/i],
  ['stateDiagram', /^stateDiagram(?:-v2)?\b/i],
  ['gitGraph', /^gitGraph\b/i],
  ['gantt', /^gantt\b/i]
];

export function detectDiagramType(text) {
  if (typeof text !== 'string') {
    throw new TypeError('Mermaid input must be a string.');
  }

  const firstRelevantLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('%%'));

  if (!firstRelevantLine) {
    throw new Error('Mermaid input is empty.');
  }

  const match = DIAGRAM_HEADERS.find(([, pattern]) => pattern.test(firstRelevantLine));
  if (!match) {
    throw new Error(`Unsupported Mermaid diagram type: ${firstRelevantLine}`);
  }

  return match[0];
}

export function parseMermaid(text) {
  const diagramType = detectDiagramType(text);

  switch (diagramType) {
    case 'flowchart':
      return parseFlowchart(text);
    case 'mindmap':
      return parseMindmap(text);
    default:
      throw new Error(`Unsupported Mermaid diagram type: ${diagramType}`);
  }
}
