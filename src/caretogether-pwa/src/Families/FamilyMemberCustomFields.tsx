import { Box, Divider, Typography } from '@mui/material';
import { CompletedCustomFieldInfo, CustomField } from '../GeneratedClient';
import { CustomFieldEditor } from '../Generic/CustomFieldEditor';
import { useDirectoryModel } from '../Model/DirectoryModel';

type CustomFieldRenderInfo = CompletedCustomFieldInfo | string;

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

  return (
    <Box sx={{ mt: 1.5 }}>
      <Divider sx={{ mb: 1 }} />
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 0.5 }}
      >
        Custom fields
      </Typography>
      {customFields.map((customField) => (
        <FamilyMemberCustomField
          key={customFieldName(customField)}
          familyId={familyId}
          personId={personId}
          customFieldPolicies={customFieldPolicies}
          customField={customField}
        />
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
