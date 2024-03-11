export function simplify(input: string) {
  // Strip out common punctuation elements and excessive whitespace, and convert to lowercase
  return input
    .replace(/[.,/#!$%^&*;:{}=\-_`'"'‘’‚‛“”„‟′‵″‶`´~()]/g, "")
    .replace(/\s{2,}/g, " ")
    .toLowerCase();
}