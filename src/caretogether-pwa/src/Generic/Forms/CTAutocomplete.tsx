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
  freeSolo?: boolean;
  fullWidth?: boolean;
  rules?: RegisterOptions<T>;
  control?: Control<T>;
  defaultValue?: PathValue<T, Path<T>>;
  options?: { title: string; value: string }[];
  helperText?: string;
  minOverallWidth?: number;
  minTypingAreaWidth?: number;
}

export function CTAutocomplete<T extends FieldValues>({
  name,
  label,
  freeSolo = false,
  fullWidth = false,
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
          freeSolo={freeSolo}
          options={options}
          isOptionEqualToValue={(option, value) => {
            // Handle string vs object comparison
            if (typeof option === 'string' && typeof value === 'string') {
              return option === value;
            }

            if (
              typeof option === 'object' &&
              typeof value === 'object' &&
              option !== null &&
              value !== null
            ) {
              return option.value === value.value;
            }

            // Handle mixed types - convert to comparable format
            const optionValue =
              typeof option === 'string'
                ? option
                : option?.title || option?.value;
            const valueValue =
              typeof value === 'string' ? value : value?.title || value?.value;

            return optionValue === valueValue;
          }}
          getOptionLabel={(option) =>
            typeof option === 'string' ? option : option.title
          }
          renderInput={(params) => {
            return (
              <TextField
                {...params}
                sx={{ minWidth: minOverallWidth }}
                fullWidth={fullWidth}
                label={label}
                helperText={helperText}
              />
            );
          }}
          {...field}
          onChange={(_, newValue) => field.onChange(newValue)}
        />
      )}
    />
  );
}
