export function createEdge(edge) {
  if (!edge?.from || !edge?.to) {
    throw new Error('Graph edge requires from and to ids.');
  }

  const normalized = {
    from: String(edge.from),
    to: String(edge.to)
  };

  if (edge.metadata) {
    normalized.metadata = { ...edge.metadata };
  }

  return normalized;
}
