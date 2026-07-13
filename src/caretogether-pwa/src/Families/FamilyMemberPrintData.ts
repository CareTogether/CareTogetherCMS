import {
  CompletedCustomFieldInfo,
  CustomField,
  CustomFieldType,
  FamilyAdultRelationshipInfo,
  Person,
} from '../GeneratedClient';
import { sortByPolicyOrder } from '../Generic/sortByPolicyOrder';

export type PrintableFamilyMember = {
  kind: 'adult' | 'child';
  person: Person;
  relationshipToFamily?: FamilyAdultRelationshipInfo;
};

type PrintableCustomField = {
  name: string;
  groupingKey?: string;
  value: string;
};

export type PrintableCustomFieldSection = {
  groupingKey?: string;
  customFields: PrintableCustomField[];
};

export function personFullName(person: Person) {
  return [person.firstName, person.lastName].filter(Boolean).join(' ');
}

function formatCustomFieldValue(
  completedCustomField: CompletedCustomFieldInfo | undefined,
  customFieldPolicy: CustomField | undefined
) {
  const value = completedCustomField?.value;
  if (value === undefined || value === null || value === '') return '';

  const fieldType =
    customFieldPolicy?.type ?? completedCustomField?.customFieldType;

  if (fieldType === CustomFieldType.Boolean) {
    return value ? 'Yes' : 'No';
  }

  if (fieldType === CustomFieldType.StringArray) {
    return Array.isArray(value)
      ? sortByPolicyOrder(
          value.map(String),
          customFieldPolicy?.validValues ?? []
        ).join(', ')
      : String(value);
  }

  if (Array.isArray(value)) {
    return value.map(String).join(', ');
  }

  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

export function buildPrintableCustomFieldSections(
  completedCustomFields: CompletedCustomFieldInfo[] | undefined,
  customFieldPolicies: CustomField[]
): PrintableCustomFieldSection[] {
  const completedFieldsByName = new Map(
    (completedCustomFields ?? []).map((completedCustomField) => [
      completedCustomField.customFieldName,
      completedCustomField,
    ])
  );
  const policyNames = new Set(customFieldPolicies.map((field) => field.name));

  const policyFields = customFieldPolicies.map((customFieldPolicy) => ({
    name: customFieldPolicy.name,
    groupingKey: customFieldPolicy.groupingKey,
    value: formatCustomFieldValue(
      completedFieldsByName.get(customFieldPolicy.name),
      customFieldPolicy
    ),
  }));
  const extraCompletedFields = (completedCustomFields ?? [])
    .filter(
      (completedCustomField) =>
        !policyNames.has(completedCustomField.customFieldName)
    )
    .sort((a, b) => a.customFieldName.localeCompare(b.customFieldName))
    .map((completedCustomField) => ({
      name: completedCustomField.customFieldName,
      groupingKey: undefined,
      value: formatCustomFieldValue(completedCustomField, undefined),
    }));

  return policyFields
    .concat(extraCompletedFields)
    .reduce<PrintableCustomFieldSection[]>((sections, customField) => {
      const existingSection = sections.find(
        (section) => section.groupingKey === customField.groupingKey
      );

      if (existingSection) {
        existingSection.customFields.push(customField);
        return sections;
      }

      return sections.concat({
        groupingKey: customField.groupingKey,
        customFields: [customField],
      });
    }, []);
}
