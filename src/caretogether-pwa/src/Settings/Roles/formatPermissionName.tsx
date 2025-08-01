import { camelCaseToSpaces } from '../../Utilities/stringUtils';

export function formatPermissionName(value: string) {
  return camelCaseToSpaces(value).replace('Add Edit', 'Add/Edit');
}
