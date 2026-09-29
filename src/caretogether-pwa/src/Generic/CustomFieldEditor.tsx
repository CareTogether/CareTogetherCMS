import {
  Autocomplete,
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  CompletedCustomFieldInfo,
  CustomField,
  CustomFieldType,
  CustomFieldValidation,
} from '../GeneratedClient';
import { useInlineEditor } from '../Hooks/useInlineEditor';
import {
  type CustomFieldValue,
  formatDateOnlyForApi,
  formatDateOnlyForDisplay,
  formatDateTimeForApi,
  formatDateTimeForDisplay,
  parseDateOnlyApiValue,
  parseDateTimeApiValue,
} from './customFieldValue';
import { ValidateDatePicker } from './Forms/ValidateDatePicker';
import { sortByPolicyOrder } from './sortByPolicyOrder';
import { CustomFieldInput } from './CustomFieldInput';

type CustomFieldEditorProps = {
  customFieldPolicy: CustomField;
  completedCustomFieldInfo?: CompletedCustomFieldInfo;
  onSave: (value: CustomFieldValue) => Promise<void>;
  presentation?: 'inline' | 'drawer';
};

export function CustomFieldEditor({
  customFieldPolicy,
  completedCustomFieldInfo,
  onSave,
  presentation = 'inline',
}: CustomFieldEditorProps) {
  const savedValue: CustomFieldValue = completedCustomFieldInfo?.value;
  const type = customFieldPolicy.type!;

  const editor = useInlineEditor(onSave, savedValue);

  const displayedValue =
    typeof savedValue === 'undefined' || savedValue == null
      ? null
      : type === CustomFieldType.Boolean
        ? savedValue
          ? 'Yes'
          : 'No'
        : type === CustomFieldType.StringArray
          ? Array.isArray(savedValue)
            ? sortByPolicyOrder(
                savedValue.map(String),
                customFieldPolicy.validValues ?? []
              ).join(', ')
            : savedValue
          : type === CustomFieldType.DateOnly
            ? formatDateOnlyForDisplay(savedValue)
            : type === CustomFieldType.DateTime
              ? formatDateTimeForDisplay(savedValue)
              : savedValue;

  if (presentation === 'drawer') {
    return (
      <Box sx={{ minWidth: 0, py: 1.25 }}>
        <Typography
          className="ph-unmask"
          color="text.primary"
          component="div"
          variant="caption"
          sx={{
            fontWeight: 700,
            letterSpacing: '0.01em',
            lineHeight: 1.35,
            mb: editor.editing ? 0.75 : 0.25,
          }}
        >
          {customFieldPolicy.name}
        </Typography>

        {editor.editing ? (
          <Stack spacing={1}>
            <CustomFieldInput
              customFieldPolicy={customFieldPolicy}
              multilineText
              value={editor.value}
              onChange={editor.setValue}
            />
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                justifyContent: 'flex-end',
                '& .MuiButton-root': { m: 0, whiteSpace: 'nowrap' },
              }}
            >
              {editor.cancelButton}
              {editor.saveButton}
            </Box>
          </Stack>
        ) : (
          <Box
            sx={{
              alignItems: 'start',
              columnGap: 1,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              minWidth: 0,
            }}
          >
            <Typography
              color={displayedValue == null ? 'text.secondary' : 'text.primary'}
              variant="body2"
              sx={{
                lineHeight: 1.5,
                minWidth: 0,
                overflowWrap: 'anywhere',
                whiteSpace: 'pre-wrap',
              }}
            >
              {displayedValue ?? '-'}
            </Typography>
            {editor.editButton}
          </Box>
        )}
      </Box>
    );
  }

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
                value={editor.value == null ? '' : editor.value ? 'yes' : 'no'}
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
                const sorted = sortByPolicyOrder(
                  newValue,
                  customFieldPolicy.validValues || []
                );
                editor.setValue(sorted.length > 0 ? sorted : null);
              }}
              freeSolo={
                customFieldPolicy.validation ===
                CustomFieldValidation.SuggestOnly
              }
              renderInput={(params) => <TextField {...params} />}
            />
          ) : type === CustomFieldType.DateOnly ? (
            <ValidateDatePicker
              value={parseDateOnlyApiValue(editor.value)}
              onChange={(date) =>
                editor.setValue(date ? formatDateOnlyForApi(date) : null)
              }
            />
          ) : type === CustomFieldType.DateTime ? (
            <ValidateDatePicker
              includeTime
              value={parseDateTimeApiValue(editor.value)}
              onChange={(date) =>
                editor.setValue(date ? formatDateTimeForApi(date) : null)
              }
            />
          ) : customFieldPolicy.validation ===
            CustomFieldValidation.SuggestOnly ? (
            <Autocomplete
              freeSolo
              value={typeof editor.value === 'string' ? editor.value : null}
              onChange={(_event, newValue: string | null) => {
                editor.setValue(
                  newValue != null && newValue.length > 0 ? newValue : null
                );
              }}
              onInputChange={(_event, newValue: string, reason) => {
                if (reason !== 'input') return;
                editor.setValue(newValue.length > 0 ? newValue : null);
              }}
              options={(customFieldPolicy.validValues || [])
                .slice()
                .sort((a, b) => -b.localeCompare(a))}
              renderInput={(params) => <TextField required {...params} />}
              inputValue={typeof editor.value === 'string' ? editor.value : ''}
            />
          ) : (
            <TextField
              variant="outlined"
              size="medium"
              value={typeof editor.value === 'string' ? editor.value : ''}
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
          Array.isArray(savedValue) ? (
            sortByPolicyOrder(
              savedValue.map(String),
              customFieldPolicy.validValues ?? []
            ).join(', ')
          ) : (
            savedValue
          )
        ) : type === CustomFieldType.DateOnly ? (
          formatDateOnlyForDisplay(savedValue)
        ) : type === CustomFieldType.DateTime ? (
          formatDateTimeForDisplay(savedValue)
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
