export function createNode(node) {
  if (!node?.id) {
    throw new Error('Graph node requires an id.');
  }

  const normalized = {
    id: String(node.id),
    text: String(node.text ?? node.id)
  };

  if (node.depth !== undefined) {
    normalized.depth = node.depth;
  }

  if (node.parentGroup) {
    normalized.parentGroup = String(node.parentGroup);
  }

  if (node.fileName) {
    normalized.fileName = node.fileName;
  }

  if (node.markdownPath) {
    normalized.markdownPath = node.markdownPath;
  }

  if (node.metadata) {
    normalized.metadata = { ...node.metadata };
  }

  return normalized;
}
