import { DatePicker } from '@mui/x-date-pickers';
import { TextFieldProps } from '@mui/material';
import { DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { useState, useEffect } from 'react';

const MIN_YEAR = 1900;
const DEFAULT_MIN_DATE = new Date(MIN_YEAR, 0, 1);

interface ValidateDatePickerProps<TDate extends Date>
  extends Omit<DatePickerProps<TDate>, 'value' | 'onChange'> {
  value: TDate | null;
  onChange: (date: TDate | null) => void;
  onErrorChange?: (hasError: boolean) => void;
  textFieldProps?: Partial<TextFieldProps>;
}

export function ValidateDatePicker<TDate extends Date>({
  value,
  onChange,
  onErrorChange,
  minDate = DEFAULT_MIN_DATE as TDate,
  label,
  textFieldProps,
  ...props
}: ValidateDatePickerProps<TDate>) {
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState('');

  useEffect(() => {
    const hasError = !!value && value.getFullYear() < MIN_YEAR;
    setError(hasError);
    setHelperText(
      hasError ? 'Enter a valid date, make sure it’s after 1900.' : ''
    );
    if (onErrorChange) onErrorChange(hasError);
  }, [value, onErrorChange]);

  return (
    <DatePicker
      {...props}
      value={value}
      onChange={onChange}
      label={label}
      disableFuture
      minDate={minDate}
      format="MM/dd/yyyy"
      slotProps={{
        textField: {
          ...textFieldProps,
          error,
          helperText,
          fullWidth: true,
        },
      }}
    />
  );
}
