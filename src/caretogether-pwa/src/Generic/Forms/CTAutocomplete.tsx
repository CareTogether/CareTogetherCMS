import { TextField, Autocomplete } from '@mui/material';
import {
  Controller,
  Control,
  FieldValues,
  RegisterOptions,
  Path,
  PathValue,
} from 'react-hook-form';

interface ICustomTextFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  rules?: RegisterOptions<T>;
  control?: Control<T>;
  defaultValue?: PathValue<T, Path<T>>;
  options?: string[];
  helperText?: string;
}

export function CTAutocomplete<T extends FieldValues>({
  name,
  label,
  control,
  options = [],
  helperText,
}: ICustomTextFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Autocomplete
          multiple
          freeSolo
          options={options}
          renderInput={(params) => (
            <TextField
              {...params}
              sx={{ minWidth: 300 }}
              fullWidth={false}
              label={label}
              helperText={helperText}
            />
          )}
          size="small"
          {...field}
          onChange={(_, newValue) => field.onChange(newValue)}
        />
      )}
    />
  );
}
