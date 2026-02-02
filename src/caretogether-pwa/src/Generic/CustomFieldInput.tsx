import {
  Autocomplete,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import {
  CustomField,
  CustomFieldType,
  CustomFieldValidation,
} from '../GeneratedClient';

type CustomFieldValue = string | boolean | number | null | undefined;

type CustomFieldInputProps = {
  customFieldPolicy: CustomField;
  value: CustomFieldValue;
  onChange: (value: CustomFieldValue) => void;
};

export function CustomFieldInput({
  customFieldPolicy,
  value,
  onChange,
}: CustomFieldInputProps) {
  const type = customFieldPolicy.type!;

  if (type === CustomFieldType.Boolean) {
    return (
      <RadioGroup
        row
        value={value == null ? '' : value === true ? 'yes' : 'no'}
        onChange={(e) =>
          onChange(
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
        <FormControlLabel value="" control={<Radio />} label="(blank)" />
      </RadioGroup>
    );
  }

  if (customFieldPolicy.validation === CustomFieldValidation.SuggestOnly) {
    return (
      <Autocomplete
        freeSolo
        options={(customFieldPolicy.validValues || [])
          .slice()
          .sort((a, b) => -b.localeCompare(a))}
        inputValue={(value as string) || ''}
        onInputChange={(_, newValue) =>
          onChange(newValue.length ? newValue : null)
        }
        renderInput={(params) => <TextField {...params} />}
      />
    );
  }

  return (
    <TextField
      variant="outlined"
      size="medium"
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
