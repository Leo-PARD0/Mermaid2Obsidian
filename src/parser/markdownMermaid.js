const MERMAID_FENCE_PATTERN = /(^|\n)(`{3,}|~{3,})[ \t]*mermaid[^\n]*\n([\s\S]*?)\n\2[ \t]*(?=\n|$)/i;

export function extractMermaidBlock(markdownText) {
  if (typeof markdownText !== 'string') {
    throw new TypeError('Markdown input must be a string.');
  }

  const match = markdownText.match(MERMAID_FENCE_PATTERN);
  if (!match) {
    throw new Error('Markdown input must contain a fenced mermaid code block.');
  }

  return match[3].trim();
}
