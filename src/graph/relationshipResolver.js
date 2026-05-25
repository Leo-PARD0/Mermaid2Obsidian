import { buildSemanticEdge, applyGroupRelationshipMetadata } from './groupRelationshipBuilder.js';
import { isGroupId, isPlaceholderGroupNode } from './hierarchyResolver.js';

export function resolveRelationships(graph) {
  const semanticEdges = [];
  const structuralEdges = [];

  for (const edge of graph.edges) {
    const semanticEdge = buildSemanticEdge(graph, edge);

    if (semanticEdge) {
      semanticEdges.push(semanticEdge);
    }

    if (!isGroupId(graph, edge.from) && !isGroupId(graph, edge.to)) {
      structuralEdges.push(edge);
    }
  }

  const resolvedGraph = {
    ...graph,
    nodes: graph.nodes.filter((node) => !isPlaceholderGroupNode(graph, node)),
    edges: structuralEdges,
    semanticEdges: dedupeSemanticEdges(semanticEdges),
    groups: graph.groups.map((group) => ({
      ...group,
      incomingGroups: [],
      outgoingGroups: []
    }))
  };

  applyGroupRelationshipMetadata(resolvedGraph, resolvedGraph.semanticEdges);
  return resolvedGraph;
}

function dedupeSemanticEdges(edges) {
  const seen = new Set();
  const deduped = [];

  for (const edge of edges) {
    const key = `${edge.from.type}:${edge.from.id}->${edge.to.type}:${edge.to.id}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(edge);
  }

  return deduped;
}
