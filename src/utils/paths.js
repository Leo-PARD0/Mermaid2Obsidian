import { dirname, extname, resolve } from 'node:path';

const CANVAS_SOURCE_EXTENSIONS = new Set(['.mmd', '.mermaid', '.md']);

export function resolveInputPath(inputPath) {
  return resolve(inputPath);
}

export function getOutputDir(inputPath) {
  return dirname(resolveInputPath(inputPath));
}

export function getCanvasOutputPath(inputPath) {
  const resolvedInputPath = resolveInputPath(inputPath);
  const extension = extname(resolvedInputPath);
  const basePath = CANVAS_SOURCE_EXTENSIONS.has(extension.toLowerCase())
    ? resolvedInputPath.slice(0, -extension.length)
    : resolvedInputPath;

  return `${basePath}.canvas`;
}
