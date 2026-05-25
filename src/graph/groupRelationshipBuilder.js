import { getGroup, getNodeOwnerGroup, isGroupId } from './hierarchyResolver.js';

export function buildSemanticEdge(graph, edge) {
  const fromEndpoint = resolveEndpoint(graph, edge.from);
  const toEndpoint = resolveEndpoint(graph, edge.to);

  if (!fromEndpoint.groupId && !toEndpoint.groupId) {
    return undefined;
  }

  if (
    fromEndpoint.groupId &&
    toEndpoint.groupId &&
    fromEndpoint.groupId === toEndpoint.groupId
  ) {
    return undefined;
  }

  return {
    from: fromEndpoint,
    to: toEndpoint
  };
}

export function applyGroupRelationshipMetadata(graph, semanticEdges) {
  for (const semanticEdge of semanticEdges) {
    const fromGroupId = semanticEdge.from.groupId;
    const toGroupId = semanticEdge.to.groupId;

    if (!fromGroupId || !toGroupId || fromGroupId === toGroupId) {
      continue;
    }

    const fromGroup = getGroup(graph, fromGroupId);
    const toGroup = getGroup(graph, toGroupId);

    if (fromGroup && !fromGroup.outgoingGroups.includes(toGroupId)) {
      fromGroup.outgoingGroups.push(toGroupId);
    }

    if (toGroup && !toGroup.incomingGroups.includes(fromGroupId)) {
      toGroup.incomingGroups.push(fromGroupId);
    }
  }
}

function resolveEndpoint(graph, id) {
  if (isGroupId(graph, id)) {
    return {
      type: 'group',
      id,
      groupId: id
    };
  }

  return {
    type: 'node',
    id,
    groupId: getNodeOwnerGroup(graph, id)
  };
}
