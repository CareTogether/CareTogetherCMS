import {
  Autocomplete,
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import {
  CompletedCustomFieldInfo,
  CustomField,
  CustomFieldType,
  CustomFieldValidation,
} from '../../GeneratedClient';
import { useInlineEditor } from '../../Hooks/useInlineEditor';

type CustomFieldEditorProps = {
  customFieldPolicy: CustomField;
  completedCustomFieldInfo?: CompletedCustomFieldInfo;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (value: any) => Promise<void>;
  isEditable?: boolean;
};

export function CustomFieldEditorV2({
  customFieldPolicy,
  completedCustomFieldInfo,
  onSave,
  isEditable = true,
}: CustomFieldEditorProps) {
  const savedValue = completedCustomFieldInfo?.value;
  const type = customFieldPolicy.type!;

  const editor = useInlineEditor(onSave, savedValue);

  return (
    <Box style={{ margin: 0 }}>
      <span>
        {customFieldPolicy.name}:&nbsp;
        {editor.editing ? (
          type === CustomFieldType.Boolean ? (
            <>
              <RadioGroup
                name="boolean-custom-field"
                row
                value={
                  (editor.value as boolean | null) == null
                    ? ''
                    : editor.value
                      ? 'yes'
                      : 'no'
                }
                onChange={(e) =>
                  editor.setValue(
                    e.target.value === 'yes'
                      ? true
                      : e.target.value === 'no'
                        ? false
                        : null
                  )
                }
              >
                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="no" control={<Radio />} label="No" />
                <FormControlLabel
                  value=""
                  control={<Radio />}
                  label="(blank)"
                />
              </RadioGroup>
            </>
          ) : customFieldPolicy.validation ===
            CustomFieldValidation.SuggestOnly ? (
            <Autocomplete
              freeSolo
              onInputChange={(_event, newValue: string) => {
                editor.setValue(newValue.length > 0 ? newValue : null);
              }}
              options={(customFieldPolicy.validValues || [])
                .slice()
                .sort((a, b) => -b.localeCompare(a))}
              renderInput={(params) => <TextField required {...params} />}
              inputValue={editor.value || ''}
            />
          ) : (
            <TextField
              variant="outlined"
              size="medium"
              value={editor.value || ''}
              onChange={(e) => editor.setValue(e.target.value)}
            />
          )
        ) : type === CustomFieldType.Boolean ? (
          savedValue ? (
            'Yes'
          ) : (
            'No'
          )
        ) : (
          savedValue
        )}
      </span>
      {isEditable && (
        <>
          {editor.editButton}
          {editor.cancelButton}
          {editor.saveButton}
        </>
      )}
    </Box>
  );
}
