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
} from '../GeneratedClient';
import { useInlineEditor } from '../Hooks/useInlineEditor';

type CustomFieldEditorProps = {
  customFieldPolicy: CustomField;
  completedCustomFieldInfo?: CompletedCustomFieldInfo;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (value: any) => Promise<void>;
};

export function CustomFieldEditor({
  customFieldPolicy,
  completedCustomFieldInfo,
  onSave,
}: CustomFieldEditorProps) {
  const savedValue = completedCustomFieldInfo?.value;
  const type = customFieldPolicy.type!;

  const editor = useInlineEditor(onSave, savedValue);

  return (
    <Box style={{ margin: 0 }}>
      <span>
        <span className="ph-unmask">{customFieldPolicy.name}:</span>&nbsp;
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
          ) : type === CustomFieldType.StringArray ? (
            <Autocomplete
              multiple
              options={customFieldPolicy.validValues || []}
              value={Array.isArray(editor.value) ? editor.value : []}
              onChange={(_event, newValue: string[]) => {
                editor.setValue(newValue.length > 0 ? newValue : null);
              }}
              freeSolo={customFieldPolicy.validation === CustomFieldValidation.SuggestOnly}
              renderInput={(params) => <TextField {...params} />}
            />
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
        ) : typeof savedValue === 'undefined' || savedValue == null ? (
          '❓'
        ) : type === CustomFieldType.Boolean ? (
          savedValue ? (
            'Yes'
          ) : (
            'No'
          )
        ) : type === CustomFieldType.StringArray ? (
          Array.isArray(savedValue)
            ? [...savedValue]
                .sort((a, b) => {
                  const validValues = customFieldPolicy.validValues ?? [];
                  const aIndex = validValues.indexOf(String(a));
                  const bIndex = validValues.indexOf(String(b));
                  if (aIndex === -1 && bIndex === -1) return 0;
                  if (aIndex === -1) return 1;
                  if (bIndex === -1) return -1;
                  return aIndex - bIndex;
                })
                .join(', ')
            : savedValue
        ) : (
          savedValue
        )}
      </span>
      {editor.editButton}
      {editor.cancelButton}
      {editor.saveButton}
    </Box>
  );
}
