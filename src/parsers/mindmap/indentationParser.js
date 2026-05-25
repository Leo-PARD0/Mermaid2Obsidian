const MINDMAP_HEADER = /^\s*mindmap\b/i;

export function parseMindmapIndentation(text) {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({
      lineNumber: index + 1,
      rawLine: stripComment(line)
    }))
    .filter((entry) => entry.rawLine.trim() && !MINDMAP_HEADER.test(entry.rawLine))
    .map((entry) => ({
      lineNumber: entry.lineNumber,
      indent: getIndent(entry.rawLine),
      text: normalizeMindmapText(entry.rawLine.trim())
    }));
}

function getIndent(line) {
  const indent = line.match(/^[ \t]*/u)[0];
  return indent.replace(/\t/g, '  ').length;
}

function normalizeMindmapText(text) {
  const withShapeRemoved = stripMindmapShape(text);
  return withShapeRemoved
    .replace(/<br\s*\/?>/giu, '\n')
    .trim();
}

function stripMindmapShape(text) {
  const idShapeMatch = text.match(/^[A-Za-z0-9_-]+\s*(\(\(|\[\[|\{\{)(.*)(\)\)|\]\]|\}\})$/u);
  if (idShapeMatch) {
    return idShapeMatch[2].trim();
  }

  const wrappedMatch = text.match(/^(\(\(|\[\[|\{\{)(.*)(\)\)|\]\]|\}\})$/u);
  if (wrappedMatch) {
    return wrappedMatch[2].trim();
  }

  return text;
}

function stripComment(line) {
  const commentIndex = line.indexOf('%%');
  return commentIndex >= 0 ? line.slice(0, commentIndex) : line;
}
