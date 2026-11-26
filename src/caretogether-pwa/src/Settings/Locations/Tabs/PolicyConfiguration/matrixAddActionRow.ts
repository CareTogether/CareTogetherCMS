export function matrixAddActionRowId(actionIds: Iterable<string>) {
  const occupied = new Set(actionIds);
  let id = '__case_policy_add_action__';
  while (occupied.has(id)) id += '_';
  return id;
}
