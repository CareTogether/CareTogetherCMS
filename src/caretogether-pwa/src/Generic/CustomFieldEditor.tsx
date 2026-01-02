import { Box } from '@mui/material';
import { CompletedCustomFieldInfo, CustomField } from '../GeneratedClient';
import { useInlineEditor } from '../Hooks/useInlineEditor';
import { CustomFieldInput } from './CustomFieldInput';

type CustomFieldEditorProps = {
  customFieldPolicy: CustomField;
  completedCustomFieldInfo?: CompletedCustomFieldInfo;
  hideActions?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (value: any) => Promise<void>;
};

export function CustomFieldEditor({
  customFieldPolicy,
  completedCustomFieldInfo,
  hideActions,
  onSave,
}: CustomFieldEditorProps) {
  const savedValue = completedCustomFieldInfo?.value;

  const editor = useInlineEditor(onSave, savedValue);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
      }}
    >
      <span className="ph-unmask">{customFieldPolicy.name}:</span>

      {editor.editing ? (
        <CustomFieldInput
          customFieldPolicy={customFieldPolicy}
          value={editor.value}
          onChange={editor.setValue}
        />
      ) : typeof savedValue === 'undefined' || savedValue == null ? (
        '❓'
      ) : (
        String(savedValue)
      )}

      {!hideActions && editor.editButton}
      {!hideActions && editor.cancelButton}
      {!hideActions && editor.saveButton}
    </Box>
  );
}
