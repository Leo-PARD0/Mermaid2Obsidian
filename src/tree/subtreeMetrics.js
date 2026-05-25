export function countTreeLeaves(node) {
  if (node.children.length === 0) {
    return 1;
  }

  return node.children.reduce((sum, child) => sum + countTreeLeaves(child), 0);
}
