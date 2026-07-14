import { CustomField } from '../GeneratedClient';

export function combineCustomFieldPolicies(
  ...customFieldPolicyGroups: CustomField[][]
) {
  return customFieldPolicyGroups
    .flat()
    .filter(
      (field, index, fields) =>
        fields.findIndex((candidate) => candidate.name === field.name) === index
    );
}
