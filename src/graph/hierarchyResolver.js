export function getNodeOwnerGroup(graph, nodeId) {
  return graph.nodes.find((node) => node.id === nodeId)?.parentGroup;
}

export function getGroup(graph, groupId) {
  return graph.groups.find((group) => group.id === groupId);
}

export function isGroupId(graph, id) {
  return graph.groups.some((group) => group.id === id);
}

export function isPlaceholderGroupNode(graph, node) {
  return isGroupId(graph, node.id) && node.text === node.id && !node.parentGroup;
}
