import { extname } from 'node:path';
import { detectDiagramType } from '../parsers/parserRouter.js';
import { extractMermaidBlock } from './markdownMermaid.js';

export function extractMermaidFromInput(inputText, inputPath = '') {
  const extension = extname(inputPath).toLowerCase();

  if (extension === '.md') {
    try {
      return extractMermaidBlock(inputText);
    } catch (error) {
      detectDiagramType(inputText);
      return inputText.trim();
    }
  }

  return inputText.trim();
}
