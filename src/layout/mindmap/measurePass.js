const NODE_WIDTH = 280;
const NODE_HEIGHT = 70;
const GROUP_MIN_WIDTH = 360;
const GROUP_MIN_HEIGHT = 180;
const GROUP_PADDING = 50;
const GROUP_HEADER = 60;
const CHILD_GAP = 30;

export const MINDMAP_GEOMETRY = {
  nodeWidth: NODE_WIDTH,
  nodeHeight: NODE_HEIGHT,
  groupPadding: GROUP_PADDING,
  groupHeader: GROUP_HEADER,
  childGap: CHILD_GAP
};

export function measureMindmap(graph) {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const groupById = new Map(graph.groups.map((group) => [group.id, group]));
  const metrics = new Map();

  for (const group of graph.groups) {
    measureGroup(group, { nodeById, groupById, metrics });
  }

  return metrics;
}

function measureGroup(group, context) {
  if (context.metrics.has(group.id)) {
    return context.metrics.get(group.id);
  }

  const childMetrics = getOrderedChildren(group)
    .map((childId) => {
      const childGroup = context.groupById.get(childId);
      if (childGroup) {
        return measureGroup(childGroup, context);
      }

      if (context.nodeById.has(childId)) {
        return {
          id: childId,
          type: 'node',
          width: NODE_WIDTH,
          height: NODE_HEIGHT
        };
      }

      return undefined;
    })
    .filter(Boolean);

  const contentWidth = childMetrics.length > 0
    ? Math.max(...childMetrics.map((metric) => metric.width))
    : 0;
  const contentHeight = childMetrics.reduce((sum, metric) => sum + metric.height, 0) +
    Math.max(0, childMetrics.length - 1) * CHILD_GAP;

  const metric = {
    id: group.id,
    type: 'group',
    width: Math.max(GROUP_MIN_WIDTH, contentWidth + GROUP_PADDING * 2),
    height: Math.max(GROUP_MIN_HEIGHT, contentHeight + GROUP_HEADER + GROUP_PADDING * 2),
    children: childMetrics
  };

  context.metrics.set(group.id, metric);
  return metric;
}

export function getOrderedChildren(group) {
  return group.metadata?.childOrder ?? [
    ...(group.children?.groups ?? []),
    ...(group.children?.nodes ?? [])
  ];
}
