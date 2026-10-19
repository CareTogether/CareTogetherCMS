import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { TextFieldProps } from '@mui/material';
import { DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { DateTimePickerProps } from '@mui/x-date-pickers/DateTimePicker';
import { useState, useEffect, useRef } from 'react';
import type { FieldRef } from '@mui/x-date-pickers/models';
import { isValid } from 'date-fns';

const MIN_YEAR = 1900;
const DEFAULT_MIN_DATE = new Date(MIN_YEAR, 0, 1);

type BaseProps = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  onErrorChange?: (hasError: boolean) => void;
  textFieldProps?: Partial<TextFieldProps>;
  includeTime?: boolean;
  // Reject partially entered dates while allowing an explicit clear to null.
  validateIncomplete?: boolean;
  label?: React.ReactNode;
};

type ValidateDatePickerProps = BaseProps &
  Omit<DatePickerProps, 'value' | 'onChange'> &
  Omit<DateTimePickerProps, 'value' | 'onChange'>;

export function ValidateDatePicker({
  value,
  onChange,
  onErrorChange,
  textFieldProps,
  includeTime = false,
  validateIncomplete = false,
  label,
  ...props
}: ValidateDatePickerProps) {
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState('');
  const fieldRef = useRef<FieldRef<Date | null>>(null);
  function reportError(hasError: boolean) {
    setError(hasError);
    setHelperText(hasError ? 'Enter a complete, valid date.' : '');
    onErrorChange?.(hasError);
  }

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
    onChange: (date: Date | null, context: { validationError: unknown }) => {
      onChange(date);
      if (validateIncomplete) reportError(context.validationError != null);
    },
    ...(validateIncomplete && {
      onError: (validationError: unknown) =>
        reportError(validationError != null),
    }),
    label,
    minDate: DEFAULT_MIN_DATE,
    minDateTime: DEFAULT_MIN_DATE,
    format: includeTime ? 'M/d/yyyy h:mm a' : 'MM/dd/yyyy',
    slotProps: {
      ...(validateIncomplete && {
        field: {
          fieldRef,
          clearable: true,
          onClear: () => {
            onChange(null);
            reportError(false);
          },
          onBlur: () => {
            const sections = fieldRef.current?.getSections() ?? [];
            if (sections.some((section) => section.value === '')) {
              reportError(sections.some((section) => section.value !== ''));
            }
          },
        },
      }),
      textField: {
        ...textFieldProps,
        error,
        helperText,
        fullWidth: true,
      },
    },
  };

  return includeTime ? (
    <DateTimePicker {...(commonProps as DateTimePickerProps)} />
  ) : (
    <DatePicker {...(commonProps as DatePickerProps)} />
  );
}
