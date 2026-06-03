import { Box } from '@mui/material';
import { useState } from 'react';
import { CustomField, EffectiveLocationPolicy } from '../../../../GeneratedClient';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
import { CustomFieldSidePanel } from './sidePanels';
import { clonePolicyWithCustomFamilyFields, nextCopyName, removeCustomField, upsertCustomField } from './policyUtils';
import { EditableActions, SectionHeader } from './sharedUi';
import { CustomFieldsTable } from './CustomFieldsTable';

export function CustomFamilyFieldsTab({
  policy,
  onPolicyChange,
}: {
  policy: EffectiveLocationPolicy;
  onPolicyChange: (policy: EffectiveLocationPolicy) => void;
}) {
  const {
    SidePanel: CustomFieldPanel,
    openSidePanel,
    closeSidePanel,
  } = useSidePanel();
  const [workingField, setWorkingField] = useState<CustomField | undefined>();
  const fields = policy.customFamilyFields ?? [];

  function openAddCustomField() {
    setWorkingField(undefined);
    openSidePanel();
  }

  function duplicateCustomField(field: CustomField) {
    saveField(
      undefined,
      new CustomField({
        ...field,
        name: nextCopyName(
          field.name,
          fields.map((item) => item.name)
        ),
      })
    );
  }

  function saveField(previousName: string | undefined, field: CustomField) {
    onPolicyChange(
      clonePolicyWithCustomFamilyFields(
        policy,
        upsertCustomField(fields, previousName, field)
      )
    );
    closeSidePanel();
  }

  function deleteCustomField(field: CustomField) {
    onPolicyChange(
      clonePolicyWithCustomFamilyFields(
        policy,
        removeCustomField(fields, field.name)
      )
    );
  }

  return (
    <Box>
      <SectionHeader
        title="Custom Family Fields"
        actions={<EditableActions onAdd={openAddCustomField} />}
      />
      <CustomFieldsTable
        fields={fields}
        onEdit={(field) => {
          setWorkingField(field);
          openSidePanel();
        }}
        onDuplicate={duplicateCustomField}
        onDelete={deleteCustomField}
      />

      <CustomFieldPanel>
        <CustomFieldSidePanel
          key={workingField?.name ?? 'new-custom-family-field'}
          title={
            workingField
              ? 'Edit Custom Family Field'
              : 'Add Custom Family Field'
          }
          field={workingField}
          existingNames={fields.map((field) => field.name)}
          onClose={closeSidePanel}
          onSave={saveField}
        />
      </CustomFieldPanel>
    </Box>
  );
}

