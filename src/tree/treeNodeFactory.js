export function createTreeNode({ id, label, depth = 0, type = 'file', metadata } = {}) {
  if (!id) {
    throw new Error('Tree node requires an id.');
  }

  const node = {
    id,
    type,
    label: String(label ?? id),
    depth,
    children: [],
    layout: {},
    metadata: metadata ? { ...metadata } : {}
  };

  return node;
}
