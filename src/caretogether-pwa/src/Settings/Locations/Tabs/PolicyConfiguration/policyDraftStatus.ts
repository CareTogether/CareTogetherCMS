export function policyDraftStatus({
  changeCount,
  saving,
  editing = false,
  error,
  saved = false,
}: {
  changeCount: number;
  saving: boolean;
  editing?: boolean;
  error?: string;
  saved?: boolean;
}) {
  const count = `${changeCount} unsaved ${changeCount === 1 ? 'change' : 'changes'}`;
  if (saving)
    return {
      kind: 'saving',
      text: 'Saving…' + (changeCount > 0 ? ` · ${count}` : ''),
    } as const;
  if (editing)
    return {
      kind: 'editing',
      text: 'Cell edit in progress' + (changeCount > 0 ? ` · ${count}` : ''),
    } as const;
  if (error)
    return {
      kind: 'error',
      text: changeCount > 0 ? count : 'Changes could not be saved',
    } as const;
  if (changeCount > 0) return { kind: 'draft', text: count } as const;
  if (saved)
    return { kind: 'saved', text: 'Changes saved successfully' } as const;
  return { kind: 'clean', text: '' } as const;
}
