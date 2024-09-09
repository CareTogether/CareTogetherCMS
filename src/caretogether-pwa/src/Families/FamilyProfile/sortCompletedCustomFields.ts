import { CompletedCustomFieldInfo } from '../../GeneratedClient';

export default function sortCompletedCustomFields(
  a: string | CompletedCustomFieldInfo,
  b: string | CompletedCustomFieldInfo
) {
  const valueA =
    a instanceof CompletedCustomFieldInfo ? a.customFieldName || '' : a;
  const valueB =
    b instanceof CompletedCustomFieldInfo ? b.customFieldName || '' : b;

  if (valueA < valueB) return -1;
  if (valueA > valueB) return 1;

  return 0;
}
