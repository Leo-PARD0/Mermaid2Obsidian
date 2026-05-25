import { createTreeIR } from '../../tree/treeIR.js';
import { createTreeNode } from '../../tree/treeNodeFactory.js';

export function buildMindmapHierarchy(entries) {
  if (entries.length === 0) {
    throw new Error('Mindmap diagram must contain at least one node.');
  }

  const rootEntry = entries[0];
  const root = createTreeNode({
    id: 'mindmap-root',
    label: rootEntry.text,
    depth: 0,
    type: 'root',
    metadata: {
      sourceLine: rootEntry.lineNumber
    }
  });
  const stack = [
    {
      indent: rootEntry.indent,
      node: root
    }
  ];
  let nodeIndex = 0;

  for (const entry of entries.slice(1)) {
    while (stack.length > 0 && stack[stack.length - 1].indent >= entry.indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      throw new Error(`Invalid mindmap indentation at line ${entry.lineNumber}.`);
    }

    const parent = stack[stack.length - 1].node;
    const node = createTreeNode({
      id: `mindmap-${nodeIndex}`,
      label: entry.text,
      depth: parent.depth + 1,
      metadata: {
        sourceLine: entry.lineNumber
      }
    });

    nodeIndex += 1;
    parent.children.push(node);
    stack.push({
      indent: entry.indent,
      node
    });
  }

  return createTreeIR(root);
}
