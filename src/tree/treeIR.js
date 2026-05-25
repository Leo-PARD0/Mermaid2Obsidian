export function createTreeIR(root) {
  if (!root) {
    throw new Error('Tree IR requires a root node.');
  }

  return {
    root
  };
}
