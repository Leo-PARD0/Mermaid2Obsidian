import { addEdge, addGroup, addNode, createGraphIR } from '../graph/graphIR.js';

const FLOWCHART_HEADER = /^\s*(?:flowchart|graph)\s+([A-Z]{2})\s*$/i;
const EDGE_OPERATORS = /(-{1,3}>|={1,3}>|-->|---)/;
const NODE_ID_PATTERN = /^\s*([A-Za-z0-9_][\w-]*)(.*)$/u;
const SUBGRAPH_PATTERN = /^subgraph\s+(.+)$/i;

export function parseMermaidToGraph(mermaidText) {
  if (typeof mermaidText !== 'string') {
    throw new TypeError('Mermaid input must be a string.');
  }

  const lines = mermaidText
    .split(/\r?\n/)
    .map(stripComment)
    .map((line) => line.trim())
    .filter(Boolean);

  const header = lines.find((line) => FLOWCHART_HEADER.test(line));
  if (!header) {
    throw new Error('Only Mermaid flowchart/graph diagrams are supported.');
  }

  const [, direction] = header.match(FLOWCHART_HEADER);
  if (!['TD', 'TB', 'BT', 'LR', 'RL'].includes(direction.toUpperCase())) {
    throw new Error(`Unsupported flowchart direction: ${direction}`);
  }

  const graph = createGraphIR({
    direction: direction.toUpperCase() === 'TB' ? 'TD' : direction.toUpperCase()
  });
  const groupStack = [];

  for (const line of lines) {
    if (FLOWCHART_HEADER.test(line)) {
      continue;
    }

    if (SUBGRAPH_PATTERN.test(line)) {
      const group = parseSubgraph(line, groupStack.at(-1));
      addGroup(graph, group);
      groupStack.push(group.id);
      continue;
    }

    if (/^end$/i.test(line)) {
      if (groupStack.length === 0) {
        throw new Error('Unexpected end without subgraph.');
      }

      groupStack.pop();
      continue;
    }

    parseStatement(line, graph, groupStack.at(-1));
  }

  if (groupStack.length > 0) {
    throw new Error(`Unclosed subgraph: ${groupStack.at(-1)}`);
  }

  return graph;
}

function parseStatement(statement, graph, parentGroup) {
  const parts = statement
    .split(EDGE_OPERATORS)
    .map((part) => part.trim())
    .filter((part) => part && !EDGE_OPERATORS.test(part));

  if (parts.length === 1) {
    const node = parseNode(parts[0]);
    addNode(graph, {
      ...node,
      parentGroup
    });
    return;
  }

  for (const part of parts) {
    addNode(graph, {
      ...parseNode(part),
      parentGroup
    });
  }

  for (let index = 0; index < parts.length - 1; index += 1) {
    const from = parseNode(parts[index]).id;
    const to = parseNode(parts[index + 1]).id;
    addEdge(graph, { from, to });
  }
}

function parseSubgraph(statement, parentGroup) {
  const [, rawDefinition] = statement.match(SUBGRAPH_PATTERN);
  const definition = rawDefinition.trim();
  const labeledMatch = definition.match(/^([^\s]+)\s+\[(.+)\]$/u);

  if (labeledMatch) {
    return {
      id: labeledMatch[1],
      label: unescapeMermaidText(stripQuotes(labeledMatch[2].trim())),
      parentGroup
    };
  }

  return {
    id: normalizeGroupId(definition),
    label: unescapeMermaidText(stripQuotes(definition)),
    parentGroup
  };
}

function normalizeGroupId(text) {
  const normalized = text
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_-]/gu, '');

  return normalized || text.trim().replace(/\s+/g, '_');
}

function parseNode(source) {
  const cleaned = source.trim().replace(/;$/, '');
  const match = cleaned.match(NODE_ID_PATTERN);

  if (!match) {
    throw new Error(`Unsupported Mermaid node syntax: ${source}`);
  }

  const [, id, rawLabel] = match;
  const label = parseLabel(rawLabel.trim());

  return {
    id,
    text: unescapeMermaidText(label ?? id)
  };
}

function parseLabel(rawLabel) {
  if (!rawLabel) {
    return undefined;
  }

  const shapePairs = [
    ['[', ']'],
    ['(', ')'],
    ['{', '}']
  ];

  for (const [open, close] of shapePairs) {
    if (rawLabel.startsWith(open) && rawLabel.endsWith(close)) {
      return stripQuotes(rawLabel.slice(1, -1).trim());
    }
  }

  throw new Error(`Unsupported Mermaid label syntax: ${rawLabel}`);
}

function stripQuotes(text) {
  const startsAndEndsWithDoubleQuote = text.startsWith('"') && text.endsWith('"');
  const startsAndEndsWithSingleQuote = text.startsWith("'") && text.endsWith("'");

  if (startsAndEndsWithDoubleQuote || startsAndEndsWithSingleQuote) {
    return text.slice(1, -1);
  }

  return text;
}

function stripComment(line) {
  const commentIndex = line.indexOf('%%');
  return commentIndex >= 0 ? line.slice(0, commentIndex) : line;
}

function unescapeMermaidText(text) {
  return text
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/<br\s*\/?>/giu, '\n');
}
