export function walkTree(node, visitor, parent = undefined) {
  visitor(node, parent);

  for (const child of node.children) {
    walkTree(child, visitor, node);
  }
}
