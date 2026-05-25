import { getOrderedChildren, MINDMAP_GEOMETRY } from './measurePass.js';

const ROOT_X = 40;
const ROOT_Y = 40;

export function layoutMindmap(graph, metrics) {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const groupById = new Map(graph.groups.map((group) => [group.id, group]));
  const rootGroups = graph.groups.filter((group) => !group.parentGroup);
  const positionedNodes = new Map();
  const positionedGroups = new Map();
  let cursorX = ROOT_X;

  for (const rootGroup of rootGroups) {
    const metric = metrics.get(rootGroup.id);
    placeGroup(rootGroup, cursorX, ROOT_Y, {
      metrics,
      nodeById,
      groupById,
      positionedNodes,
      positionedGroups
    });
    cursorX += metric.width + MINDMAP_GEOMETRY.childGap * 2;
  }

  return {
    ...graph,
    nodes: graph.nodes.map((node) => ({
      ...node,
      ...positionedNodes.get(node.id),
      width: node.width ?? MINDMAP_GEOMETRY.nodeWidth,
      height: node.height ?? MINDMAP_GEOMETRY.nodeHeight
    })),
    groups: graph.groups.map((group) => ({
      ...group,
      bounds: positionedGroups.get(group.id)
    })),
    edges: graph.edges.map((edge) => ({ ...edge }))
  };
}

function placeGroup(group, x, y, context) {
  const metric = context.metrics.get(group.id);
  context.positionedGroups.set(group.id, {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(metric.width),
    height: Math.round(metric.height)
  });

  let cursorY = y + MINDMAP_GEOMETRY.groupHeader + MINDMAP_GEOMETRY.groupPadding;
  const childX = x + MINDMAP_GEOMETRY.groupPadding;

  for (const childId of getOrderedChildren(group)) {
    const childGroup = context.groupById.get(childId);

    if (childGroup) {
      const childMetric = context.metrics.get(childGroup.id);
      placeGroup(childGroup, childX, cursorY, context);
      cursorY += childMetric.height + MINDMAP_GEOMETRY.childGap;
      continue;
    }

    if (context.nodeById.has(childId)) {
      context.positionedNodes.set(childId, {
        x: Math.round(childX),
        y: Math.round(cursorY)
      });
      cursorY += MINDMAP_GEOMETRY.nodeHeight + MINDMAP_GEOMETRY.childGap;
    }
  }
}
