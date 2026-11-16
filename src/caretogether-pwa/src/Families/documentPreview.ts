export type DocumentPreviewKind = 'image' | 'pdf';

// Formats every major browser renders natively. The API serves these with a matching
// Content-Type for inline previews; anything else is only offered as a download.
const previewKindsByExtension: Readonly<Record<string, DocumentPreviewKind>> = {
  avif: 'image',
  bmp: 'image',
  gif: 'image',
  jpeg: 'image',
  jpg: 'image',
  pdf: 'pdf',
  png: 'image',
  webp: 'image',
};

export function documentFileExtension(fileName?: string) {
  const trimmedFileName = fileName?.trim();
  if (!trimmedFileName?.includes('.')) return undefined;

  const extension = trimmedFileName.split('.').pop()?.trim();
  if (!extension) return undefined;

  return extension.toLocaleLowerCase();
}

export function documentPreviewKind(
  fileName?: string
): DocumentPreviewKind | undefined {
  const extension = documentFileExtension(fileName);
  if (!extension) return undefined;

  return Object.hasOwn(previewKindsByExtension, extension)
    ? previewKindsByExtension[extension]
    : undefined;
}

export function isPreviewableDocument(fileName?: string) {
  return documentPreviewKind(fileName) !== undefined;
}
