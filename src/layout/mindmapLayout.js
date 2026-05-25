import { layoutMindmap } from './mindmap/layoutPass.js';
import { measureMindmap } from './mindmap/measurePass.js';

export function applyMindmapLayout(graph) {
  const metrics = measureMindmap(graph);
  return layoutMindmap(graph, metrics);
}
