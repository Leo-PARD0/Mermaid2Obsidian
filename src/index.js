#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { askUserOptions } from './cli/prompts.js';
import { normalizeExportMode } from './exporter/exportModes.js';
import { exportToObsidianCanvas } from './exporter/obsidianCanvas.js';
import { resolveRelationships } from './graph/relationshipResolver.js';
import { applyLayout } from './layout/dagreLayout.js';
import { applyGroupLayout } from './layout/groupLayout.js';
import { applyLayoutForGraph } from './layout/layoutRouter.js';
import { extractMermaidFromInput } from './parser/inputLoader.js';
import { extractMermaidBlock } from './parser/markdownMermaid.js';
import { parseMermaidToGraph } from './parser/mermaidParser.js';
import { detectDiagramType, parseMermaid } from './parsers/parserRouter.js';
import { getCanvasOutputPath, getOutputDir, resolveInputPath } from './utils/paths.js';

export { exportToObsidianCanvas } from './exporter/obsidianCanvas.js';
export { EXPORT_MODES, normalizeExportMode } from './exporter/exportModes.js';
export { createGraphIR } from './graph/graphIR.js';
export { resolveRelationships } from './graph/relationshipResolver.js';
export { applyLayout } from './layout/dagreLayout.js';
export { applyGroupLayout } from './layout/groupLayout.js';
export { applyLayoutForGraph } from './layout/layoutRouter.js';
export { extractMermaidFromInput } from './parser/inputLoader.js';
export { extractMermaidBlock } from './parser/markdownMermaid.js';
export { parseMermaidToGraph } from './parser/mermaidParser.js';
export { detectDiagramType, parseMermaid } from './parsers/parserRouter.js';
export { buildMindmapHierarchy } from './parsers/mindmap/hierarchyBuilder.js';
export { parseMindmapIndentation } from './parsers/mindmap/indentationParser.js';
export { classifyMindmapTree } from './parsers/mindmap/semanticClassifier.js';
export { createTreeIR } from './tree/treeIR.js';
export { createTreeNode } from './tree/treeNodeFactory.js';
export { walkTree } from './tree/hierarchyResolver.js';
export { countTreeLeaves } from './tree/subtreeMetrics.js';
export { getCanvasOutputPath, getOutputDir } from './utils/paths.js';
export { sanitizeFilename } from './utils/sanitize.js';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli(process.argv.slice(2));
}

async function runCli(args) {
  const options = await resolveCliOptions(args);
  const result = await compileWorkspace(options);

  console.log(`Canvas gerado: ${result.canvasPath}`);
}

export async function compileWorkspace({ inputPath, exportMode = 'text' }) {
  const normalizedExportMode = normalizeExportMode(exportMode);
  const resolvedInputPath = resolveInputPath(inputPath);
  const canvasPath = getCanvasOutputPath(resolvedInputPath);
  const input = await readFile(resolvedInputPath, 'utf8');
  const mermaidText = extractMermaidFromInput(input, resolvedInputPath);
  const graph = resolveRelationships(parseMermaid(mermaidText));
  const positionedGraph = applyLayoutForGraph(graph);
  const canvas = exportToObsidianCanvas(positionedGraph, { mode: normalizedExportMode });

  await writeFile(canvasPath, `${JSON.stringify(canvas, null, 2)}\n`, 'utf8');

  return {
    canvasPath,
    exportMode: normalizedExportMode
  };
}

async function resolveCliOptions(args) {
  if (args.length === 0) {
    return askUserOptions();
  }

  const [inputPath, exportMode = 'text'] = args;

  if (!inputPath) {
    throw new Error('Usage: node src/index.js [input.mmd] [text|file]');
  }

  return {
    inputPath,
    exportMode: normalizeExportMode(exportMode)
  };
}
