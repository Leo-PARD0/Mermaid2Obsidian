import { applyLayout as applyDagreLayout } from './dagreLayout.js';

export function applyFlowchartLayout(graph, options = {}) {
  return applyDagreLayout(graph, options);
}
