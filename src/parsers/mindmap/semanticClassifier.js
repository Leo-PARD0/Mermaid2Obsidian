export function classifyMindmapTree(node, isRoot = false) {
  if (isRoot) {
    node.type = 'root';
  } else {
    node.type = node.children.length > 0 ? 'group' : 'file';
  }

  for (const child of node.children) {
    classifyMindmapTree(child);
  }

  return node;
}
