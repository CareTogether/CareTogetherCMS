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
  minOverallWidth?: number;
  minTypingAreaWidth?: number;
}

export function CTAutocomplete<T extends FieldValues>({
  name,
  label,
  control,
  options = [],
  helperText,
  minOverallWidth = 300,
  minTypingAreaWidth,
}: ICustomTextFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Autocomplete
          sx={{
            '& .MuiAutocomplete-inputRoot .MuiAutocomplete-input': {
              minWidth: minTypingAreaWidth,
            },
          }}
          multiple
          freeSolo
          options={options}
          renderInput={(params) => {
            console.log(params);
            return (
              <TextField
                {...params}
                sx={{ minWidth: minOverallWidth }}
                fullWidth={false}
                label={label}
                helperText={helperText}
              />
            );
          }}
          size="small"
          {...field}
          onChange={(_, newValue) => field.onChange(newValue)}
        />
      )}
    />
  );
}
