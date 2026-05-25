export function createGroup(group) {
  if (!group?.id) {
    throw new Error('Graph group requires an id.');
  }

  const normalized = {
    id: String(group.id),
    label: String(group.label ?? group.id),
    incomingGroups: [],
    outgoingGroups: [],
    children: {
      nodes: [],
      groups: []
    }
  };

  if (group.parentGroup) {
    normalized.parentGroup = String(group.parentGroup);
  }

  if (group.bounds) {
    normalized.bounds = { ...group.bounds };
  }

  if (group.metadata) {
    normalized.metadata = { ...group.metadata };
  }

  return normalized;
}
