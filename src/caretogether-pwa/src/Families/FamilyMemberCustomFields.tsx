import { Box, Divider, Typography } from '@mui/material';
import { CompletedCustomFieldInfo, CustomField } from '../GeneratedClient';
import { CustomFieldEditor } from '../Generic/CustomFieldEditor';
import { useDirectoryModel } from '../Model/DirectoryModel';

type CustomFieldRenderInfo = CompletedCustomFieldInfo | string;

type CustomFieldSection = {
  groupingKey?: string;
  customFields: CustomFieldRenderInfo[];
};

type FamilyMemberCustomFieldsProps = {
  familyId: string;
  personId: string;
  customFieldPolicies: CustomField[];
  completedCustomFields?: CompletedCustomFieldInfo[];
};

function customFieldName(customField: CustomFieldRenderInfo) {
  return customField instanceof CompletedCustomFieldInfo
    ? customField.customFieldName!
    : customField;
}

function orderCustomFieldsByPolicy(
  customFields: CustomFieldRenderInfo[],
  fieldNamesInOrder: string[]
) {
  const customFieldsByName = new Map(
    customFields.map((customField) => [
      customFieldName(customField),
      customField,
    ])
  );

  return fieldNamesInOrder.flatMap((fieldName) => {
    const customField = customFieldsByName.get(fieldName);
    return customField == null ? [] : [customField];
  });
}

function groupCustomFieldsByPolicy(
  customFields: CustomFieldRenderInfo[],
  customFieldPolicies: CustomField[]
) {
  const policiesByName = new Map(
    customFieldPolicies.map((customFieldPolicy) => [
      customFieldPolicy.name,
      customFieldPolicy,
    ])
  );

  return customFields.reduce<CustomFieldSection[]>((sections, customField) => {
    const groupingKey =
      policiesByName.get(customFieldName(customField))?.groupingKey ??
      undefined;
    if (sections.some((section) => section.groupingKey === groupingKey)) {
      return sections.map((section) =>
        section.groupingKey === groupingKey
          ? {
              ...section,
              customFields: section.customFields.concat(customField),
            }
          : section
      );
    }

    return sections.concat({ groupingKey, customFields: [customField] });
  }, []);
}

export function FamilyMemberCustomFields({
  familyId,
  personId,
  customFieldPolicies,
  completedCustomFields = [],
}: FamilyMemberCustomFieldsProps) {
  const completedFieldNames = new Set(
    completedCustomFields.map((field) => field.customFieldName)
  );
  const customFields = orderCustomFieldsByPolicy(
    Array<CustomFieldRenderInfo>()
      .concat(completedCustomFields)
      .concat(
        customFieldPolicies
          .filter((field) => !completedFieldNames.has(field.name))
          .map((field) => field.name!)
      ),
    customFieldPolicies.map((field) => field.name!)
  );

  if (customFields.length === 0) {
    return null;
  }

  const customFieldSections = groupCustomFieldsByPolicy(
    customFields,
    customFieldPolicies
  );

  return (
    <Box sx={{ mt: 1.5 }}>
      <Divider sx={{ mb: 1 }} />
      {customFieldSections.map((section, sectionIndex) => (
        <Box key={section.groupingKey ?? `ungrouped-${sectionIndex}`}>
          {section.groupingKey && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1, mb: 0.25 }}
            >
              {section.groupingKey}
            </Typography>
          )}
          {section.customFields.map((customField) => (
            <FamilyMemberCustomField
              key={customFieldName(customField)}
              familyId={familyId}
              personId={personId}
              customFieldPolicies={customFieldPolicies}
              customField={customField}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}

type FamilyMemberCustomFieldProps = {
  familyId: string;
  personId: string;
  customFieldPolicies: CustomField[];
  customField: CustomFieldRenderInfo;
};

function FamilyMemberCustomField({
  familyId,
  personId,
  customFieldPolicies,
  customField,
}: FamilyMemberCustomFieldProps) {
  const directoryModel = useDirectoryModel();
  const savedCustomField =
    customField instanceof CompletedCustomFieldInfo ? customField : null;
  const customFieldPolicy = customFieldPolicies.find((cf) =>
    savedCustomField
      ? cf.name === savedCustomField.customFieldName
      : cf.name === customField
  );

  if (customFieldPolicy == null) {
    return null;
  }

  return (
    <CustomFieldEditor
      customFieldPolicy={customFieldPolicy}
      completedCustomFieldInfo={savedCustomField ?? undefined}
      onSave={async (value) => {
        await directoryModel.updateCustomFamilyMemberField(
          familyId,
          personId,
          customFieldPolicy,
          value
        );
      }}
    />
  );
}
