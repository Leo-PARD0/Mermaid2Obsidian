import { addGroup, addNode, createGraphIR } from '../../graph/graphIR.js';
import { walkTree } from '../../tree/hierarchyResolver.js';
import { buildMindmapHierarchy } from './hierarchyBuilder.js';
import { parseMindmapIndentation } from './indentationParser.js';
import { classifyMindmapTree } from './semanticClassifier.js';

export function parseMindmap(text) {
  if (typeof text !== 'string') {
    throw new TypeError('Mermaid input must be a string.');
  }

  const entries = parseMindmapIndentation(text);
  const tree = buildMindmapHierarchy(entries);
  classifyMindmapTree(tree.root, true);

  const graph = createGraphIR({
    diagramType: 'mindmap',
    direction: 'LR'
  });

  walkTree(tree.root, (treeNode, parent) => {
    if (treeNode.type === 'root' || treeNode.type === 'group') {
      addGroup(graph, {
        id: treeNode.id,
        label: treeNode.label,
        parentGroup: parent?.id,
        metadata: {
          childOrder: treeNode.children.map((child) => child.id)
        }
      });
      return;
    }

    addNode(graph, {
      id: treeNode.id,
      text: treeNode.label,
      depth: treeNode.depth,
      parentGroup: parent?.id
    });
  });

  graph.metadata.tree = tree;
  return graph;
}
