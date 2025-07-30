export function simplify(input: string) {
  // Strip out common punctuation elements and excessive whitespace, and convert to lowercase
  return input
    .replace(/[.,/#!$%^&*;:{}=\-_`'"'‘’‚‛“”„‟′‵″‶`´~()]/g, '')
    .replace(/\s{2,}/g, ' ')
    .toLowerCase();
}

export function summarizeList(list: string[], size = 3) {
  const limitedList = list.slice(0, size);

  if (list.length <= size) {
    return limitedList.join(', ');
  }

  return `${list.slice(0, size).join(', ')} +${list.length - size} more`;
}
