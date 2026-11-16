import type { InputOptions } from 'rolldown';

// MUI and other libraries start their modules with 'use client'. Bundling a
// harness into a single IIFE drops those directives, which is harmless here,
// but rolldown warns once per module and floods the CI log.
export const ignoreModuleLevelDirectives: InputOptions['onLog'] = (
  level,
  log,
  defaultHandler
) => {
  if (log.code === 'MODULE_LEVEL_DIRECTIVE') return;
  defaultHandler(level, log);
};
