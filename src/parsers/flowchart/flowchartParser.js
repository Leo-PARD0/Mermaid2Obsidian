import { parseMermaidToGraph } from '../../parser/mermaidParser.js';

export function parseFlowchart(text) {
  const graph = parseMermaidToGraph(text);

  return {
    ...graph,
    diagramType: 'flowchart'
  };
}
