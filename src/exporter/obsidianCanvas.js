import { createId } from '../utils/ids.js';
import { sanitizeFilename } from '../utils/sanitize.js';
import { EXPORT_MODES, normalizeExportMode } from './exportModes.js';

export function exportToObsidianCanvas(graph, options = {}) {
  const mode = normalizeExportMode(options.mode);
  const nodeIdMap = new Map();
  const groupConnectorIdMap = new Map();
  const rankdir = graph.direction ?? 'TD';
  const vertical = ['TD', 'TB', 'BT'].includes(rankdir);
  const reverse = ['BT', 'RL'].includes(rankdir);

  const groupNodes = (graph.groups ?? []).map((group) => ({
    id: createId('group'),
    type: 'group',
    label: group.label,
    x: group.bounds?.x ?? 0,
    y: group.bounds?.y ?? 0,
    width: group.bounds?.width ?? 320,
    height: group.bounds?.height ?? 180
  }));

  const connectorGroupIds = getConnectorGroupIds(graph.semanticEdges ?? []);
  const groupConnectorNodes = (graph.groups ?? [])
    .filter((group) => connectorGroupIds.has(group.id))
    .map((group) => {
    const connectorId = createId('group-connector');
    groupConnectorIdMap.set(group.id, connectorId);

    return {
      id: connectorId,
      type: 'text',
      text: '',
      x: Math.round((group.bounds?.x ?? 0) + (group.bounds?.width ?? 320) / 2),
      y: Math.round((group.bounds?.y ?? 0) + (group.bounds?.height ?? 180) / 2),
      width: 1,
      height: 1
    };
  });

  const nodes = graph.nodes.map((node) => {
    const canvasId = createId('node');
    nodeIdMap.set(node.id, canvasId);

    const baseNode = {
      id: canvasId,
      x: node.x ?? 0,
      y: node.y ?? 0,
      width: node.width ?? 250,
      height: node.height ?? 60
    };

    if (mode === EXPORT_MODES.FILE) {
      return {
        ...baseNode,
        type: 'file',
        file: node.fileName ?? `${sanitizeFilename(node.text)}.md`
      };
    }

    return {
      ...baseNode,
      type: 'text',
      text: node.text
    };
  });

  const nodePositionById = new Map(
    [
      ...groupConnectorNodes,
      ...nodes
    ].map((node) => [node.id, node])
  );

  const edges = [
    ...graph.edges.map((edge) => ({
      id: createId('edge'),
      fromNode: nodeIdMap.get(edge.from),
      fromSide: getFromSide({ vertical, reverse }),
      toNode: nodeIdMap.get(edge.to),
      toSide: getToSide({ vertical, reverse })
    })),
    ...(graph.semanticEdges ?? []).map((edge) => {
      const fromNode = getEndpointCanvasId(edge.from, nodeIdMap, groupConnectorIdMap);
      const toNode = getEndpointCanvasId(edge.to, nodeIdMap, groupConnectorIdMap);
      const sides = getDynamicSides(
        nodePositionById.get(fromNode),
        nodePositionById.get(toNode)
      );

      return {
        id: createId('semantic-edge'),
        fromNode,
        fromSide: sides.fromSide,
        toNode,
        toSide: sides.toSide
      };
    })
  ].filter((edge) => edge.fromNode && edge.toNode);

  return {
    nodes: [
      ...groupNodes,
      ...nodes,
      ...groupConnectorNodes
    ],
    edges
  };
}

function getEndpointCanvasId(endpoint, nodeIdMap, groupConnectorIdMap) {
  if (endpoint.type === 'group') {
    return groupConnectorIdMap.get(endpoint.id);
  }

  return nodeIdMap.get(endpoint.id);
}

function getConnectorGroupIds(semanticEdges) {
  const groupIds = new Set();

  for (const edge of semanticEdges) {
    if (edge.from.type === 'group') {
      groupIds.add(edge.from.id);
    }

    if (edge.to.type === 'group') {
      groupIds.add(edge.to.id);
    }
  }

  return groupIds;
}

function getDynamicSides(fromNode, toNode) {
  if (!fromNode || !toNode) {
    return {
      fromSide: 'right',
      toSide: 'left'
    };
  }

  const fromCenter = {
    x: fromNode.x + fromNode.width / 2,
    y: fromNode.y + fromNode.height / 2
  };
  const toCenter = {
    x: toNode.x + toNode.width / 2,
    y: toNode.y + toNode.height / 2
  };
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return {
      fromSide: dx >= 0 ? 'right' : 'left',
      toSide: dx >= 0 ? 'left' : 'right'
    };
  }

  return {
    fromSide: dy >= 0 ? 'bottom' : 'top',
    toSide: dy >= 0 ? 'top' : 'bottom'
  };
}

function getFromSide({ vertical, reverse }) {
  if (vertical) {
    return reverse ? 'top' : 'bottom';
  }

  return reverse ? 'left' : 'right';
}

function getToSide({ vertical, reverse }) {
  if (vertical) {
    return reverse ? 'bottom' : 'top';
  }

  return reverse ? 'right' : 'left';
}
