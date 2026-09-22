export function normalizeShellSearchText(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}
