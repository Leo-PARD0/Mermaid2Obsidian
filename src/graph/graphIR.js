import { createEdge } from './edgeFactory.js';
import { createGroup } from './groupFactory.js';
import { createNode } from './nodeFactory.js';

export function createGraphIR({ diagramType = 'flowchart', direction = 'TD', nodes = [], edges = [], groups = [] } = {}) {
  const graph = {
    diagramType,
    direction,
    nodes: [],
    edges: [],
    groups: [],
    semanticEdges: [],
    metadata: {
      diagramType
    }
  };

  for (const group of groups) {
    addGroup(graph, group);
  }

  for (const edge of edges) {
    addEdge(graph, edge);
  }

  for (const node of nodes) {
    addNode(graph, node);
  }

  return graph;
}

export function addNode(graph, node) {
  const normalized = createNode(node);
  const existing = graph.nodes.find((item) => item.id === normalized.id);
  if (existing) {
    if (normalized.text && existing.text === existing.id) {
      existing.text = normalized.text;
    }
    if (normalized.parentGroup && !existing.parentGroup) {
      existing.parentGroup = normalized.parentGroup;
      addNodeToGroup(graph, normalized.parentGroup, existing.id);
    }
    existing.metadata = {
      ...existing.metadata,
      ...normalized.metadata
    };
    existing.incomingGroups = mergeUnique(existing.incomingGroups, normalized.incomingGroups);
    existing.outgoingGroups = mergeUnique(existing.outgoingGroups, normalized.outgoingGroups);
    return existing;
  }

  graph.nodes.push(normalized);

  if (normalized.parentGroup) {
    addNodeToGroup(graph, normalized.parentGroup, normalized.id);
  }

  return normalized;
}

export function addEdge(graph, edge) {
  const normalized = createEdge(edge);

  addNode(graph, { id: normalized.from });
  addNode(graph, { id: normalized.to });

  graph.edges.push(normalized);
  return normalized;
}

export function addGroup(graph, group) {
  const normalized = createGroup(group);
  const existing = graph.groups.find((item) => item.id === normalized.id);

  if (existing) {
    existing.label = normalized.label;
    existing.parentGroup = existing.parentGroup ?? normalized.parentGroup;
    existing.metadata = {
      ...existing.metadata,
      ...normalized.metadata
    };
    return existing;
  }

  graph.groups.push(normalized);

  if (normalized.parentGroup) {
    addGroupToGroup(graph, normalized.parentGroup, normalized.id);
  }

  return normalized;
}

function addNodeToGroup(graph, groupId, nodeId) {
  const group = graph.groups.find((item) => item.id === groupId);
  if (group && !group.children.nodes.includes(nodeId)) {
    group.children.nodes.push(nodeId);
  }
}

function addGroupToGroup(graph, parentGroupId, groupId) {
  const group = graph.groups.find((item) => item.id === parentGroupId);
  if (group && !group.children.groups.includes(groupId)) {
    group.children.groups.push(groupId);
  }
}

function mergeUnique(left = [], right = []) {
  return [...new Set([...left, ...right])];
}
