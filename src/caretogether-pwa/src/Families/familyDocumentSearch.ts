export function filterFamilyDocumentsByFilename<
  T extends { uploadedFileName?: string },
>(rows: readonly T[], query: string): readonly T[] {
  const search = query.trim().toLowerCase();
  return search
    ? rows.filter((row) =>
        (row.uploadedFileName ?? '').toLowerCase().includes(search)
      )
    : rows;
}
