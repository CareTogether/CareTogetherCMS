import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { TextFieldProps } from '@mui/material';
import { DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { DateTimePickerProps } from '@mui/x-date-pickers/DateTimePicker';
import { useState, useEffect } from 'react';
import { isValid } from 'date-fns';

const MIN_YEAR = 1900;
const DEFAULT_MIN_DATE = new Date(MIN_YEAR, 0, 1);

type BaseProps = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  onErrorChange?: (hasError: boolean) => void;
  textFieldProps?: Partial<TextFieldProps>;
  includeTime?: boolean;
  label?: React.ReactNode;
};

type ValidateDatePickerProps = BaseProps &
  Omit<DatePickerProps<Date>, 'value' | 'onChange'> &
  Omit<DateTimePickerProps<Date>, 'value' | 'onChange'>;

export function ValidateDatePicker({
  value,
  onChange,
  onErrorChange,
  textFieldProps,
  includeTime = false,
  label,
  ...props
}: ValidateDatePickerProps) {
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState('');

  useEffect(() => {
    const hasError =
      !!value && (!isValid(value) || value.getFullYear() < MIN_YEAR);

    setError(hasError);
    setHelperText(
      hasError ? 'Enter a valid date, make sure it’s after 1900.' : ''
    );

    if (onErrorChange) onErrorChange(hasError);
  }, [value, onErrorChange]);

  const commonProps = {
    ...props,
    value,
    onChange,
    label,
    minDate: DEFAULT_MIN_DATE,
    minDateTime: DEFAULT_MIN_DATE,
    format: includeTime ? 'M/d/yyyy h:mm a' : 'MM/dd/yyyy',
    slotProps: {
      textField: {
        ...textFieldProps,
        error,
        helperText,
        fullWidth: true,
      },
    },
  };

  return includeTime ? (
    <DateTimePicker {...commonProps} />
  ) : (
    <DatePicker {...commonProps} />
  );
}
