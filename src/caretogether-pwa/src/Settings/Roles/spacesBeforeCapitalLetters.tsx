export function spacesBeforeCapitalLetters(value: string) {
  let result = '';
  for (const c of value) {
    result += result.length > 0 && c.toUpperCase() === c ? ' ' + c : c;
    if (result === 'Add Edit') {
      result = 'Add/Edit';
    }
  }
  return result;
}
