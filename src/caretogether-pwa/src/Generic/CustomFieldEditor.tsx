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
import { sortByPolicyOrder } from './sortByPolicyOrder';

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
              value={sortByPolicyOrder(
                Array.isArray(editor.value) ? editor.value : [],
                customFieldPolicy.validValues || []
              )}
              onChange={(_event, newValue: string[]) => {
                const sorted = sortByPolicyOrder(newValue, customFieldPolicy.validValues || []);
                editor.setValue(sorted.length > 0 ? sorted : null);
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
            ? sortByPolicyOrder(
                savedValue.map(String),
                customFieldPolicy.validValues ?? []
              ).join(', ')
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
