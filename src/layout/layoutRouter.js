import { applyFlowchartLayout } from './flowchartLayout.js';
import { applyGroupLayout } from './groupLayout.js';
import { applyMindmapLayout } from './mindmapLayout.js';

export function applyLayoutForGraph(graph, options = {}) {
  let positionedGraph;

  switch (graph.diagramType) {
    case 'flowchart':
      positionedGraph = applyFlowchartLayout(graph, options);
      break;
    case 'mindmap':
      positionedGraph = applyMindmapLayout(graph, options);
      return positionedGraph;
    default:
      throw new Error(`Unsupported layout for diagram type: ${graph.diagramType}`);
  }

  return applyGroupLayout(positionedGraph, options.groups);
}
