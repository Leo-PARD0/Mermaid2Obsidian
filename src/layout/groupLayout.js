const GROUP_PADDING = 40;
const EMPTY_GROUP_WIDTH = 320;
const EMPTY_GROUP_HEIGHT = 180;

export function applyGroupLayout(graph, options = {}) {
  if (!graph.groups?.length) {
    return graph;
  }

  const padding = options.padding ?? GROUP_PADDING;
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const groupById = new Map(graph.groups.map((group) => [group.id, group]));
  const boundsByGroup = new Map();

  const computeBounds = (group) => {
    if (boundsByGroup.has(group.id)) {
      return boundsByGroup.get(group.id);
    }

    const childBounds = [];

    for (const nodeId of group.children?.nodes ?? []) {
      const node = nodeById.get(nodeId);
      if (node) {
        childBounds.push({
          x: node.x ?? 0,
          y: node.y ?? 0,
          width: node.width ?? 250,
          height: node.height ?? 60
        });
      }
    }

    for (const groupId of group.children?.groups ?? []) {
      const childGroup = groupById.get(groupId);
      if (childGroup) {
        childBounds.push(computeBounds(childGroup));
      }
    }

    const bounds = childBounds.length > 0
      ? createPaddedBounds(childBounds, padding)
      : {
          x: 0,
          y: 0,
          width: EMPTY_GROUP_WIDTH,
          height: EMPTY_GROUP_HEIGHT
        };

    boundsByGroup.set(group.id, bounds);
    return bounds;
  };

  return {
    ...graph,
    groups: graph.groups.map((group) => ({
      ...group,
      bounds: computeBounds(group)
    }))
  };
}

function createPaddedBounds(boundsList, padding) {
  const minX = Math.min(...boundsList.map((bounds) => bounds.x));
  const minY = Math.min(...boundsList.map((bounds) => bounds.y));
  const maxX = Math.max(...boundsList.map((bounds) => bounds.x + bounds.width));
  const maxY = Math.max(...boundsList.map((bounds) => bounds.y + bounds.height));

  return {
    x: Math.round(minX - padding),
    y: Math.round(minY - padding),
    width: Math.round(maxX - minX + padding * 2),
    height: Math.round(maxY - minY + padding * 2)
  };
}
