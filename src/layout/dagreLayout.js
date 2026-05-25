import dagre from 'dagre';

const DEFAULT_NODE_WIDTH = 250;
const DEFAULT_NODE_HEIGHT = 60;

export function applyLayout(graph, options = {}) {
  const rankdir = options.rankdir ?? graph.direction ?? 'TD';
  const graphLayout = new dagre.graphlib.Graph();

  graphLayout.setDefaultEdgeLabel(() => ({}));
  graphLayout.setGraph({
    rankdir,
    ranksep: options.ranksep ?? 120,
    nodesep: options.nodesep ?? 80,
    marginx: options.marginx ?? 40,
    marginy: options.marginy ?? 40
  });

  for (const node of graph.nodes) {
    const width = node.width ?? DEFAULT_NODE_WIDTH;
    const height = node.height ?? DEFAULT_NODE_HEIGHT;
    graphLayout.setNode(node.id, { width, height });
  }

  for (const edge of graph.edges) {
    graphLayout.setEdge(edge.from, edge.to);
  }

  dagre.layout(graphLayout);

  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      const positioned = graphLayout.node(node.id);
      const width = node.width ?? DEFAULT_NODE_WIDTH;
      const height = node.height ?? DEFAULT_NODE_HEIGHT;

      return {
        ...node,
        x: Math.round(positioned.x - width / 2),
        y: Math.round(positioned.y - height / 2),
        width,
        height
      };
    }),
    edges: graph.edges.map((edge) => ({ ...edge }))
  };
}
