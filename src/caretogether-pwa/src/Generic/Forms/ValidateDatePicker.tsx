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
  validateIncomplete?: boolean;
  clearable?: boolean;
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
  clearable = false,
  label,
  ...props
}: ValidateDatePickerProps) {
  const [inputValidation, setInputValidation] = useState({
    value,
    muiError: false,
    incomplete: false,
  });
  const fieldRef = useRef<FieldRef<Date | null>>(null);
  const lastNotifiedError = useRef<boolean | undefined>(undefined);
  const error =
    (!!value && (!isValid(value) || value.getFullYear() < MIN_YEAR)) ||
    (validateIncomplete &&
      (inputValidation.muiError ||
        (inputValidation.value === value && inputValidation.incomplete)));
  const helperText = error
    ? 'Enter a complete, valid date on or after January 1, 1900.'
    : '';

  useEffect(() => {
    if (!onErrorChange || lastNotifiedError.current === error) return;
    lastNotifiedError.current = error;
    onErrorChange(error);
  }, [error, onErrorChange]);

  const commonProps = {
    ...props,
    value,
    onChange: (date: Date | null, context: { validationError: unknown }) => {
      onChange(date);
      if (validateIncomplete) {
        setInputValidation({
          value: date,
          muiError: context.validationError != null,
          incomplete: false,
        });
      }
    },
    ...(validateIncomplete && {
      onError: (validationError: unknown) =>
        setInputValidation((current) => ({
          value,
          muiError: validationError != null,
          incomplete: current.value === value && current.incomplete,
        })),
    }),
    label,
    minDate: DEFAULT_MIN_DATE,
    minDateTime: DEFAULT_MIN_DATE,
    format: includeTime ? 'M/d/yyyy h:mm a' : 'MM/dd/yyyy',
    slotProps: {
      field: {
        clearable,
        onClear: () => {
          setInputValidation({
            value: null,
            muiError: false,
            incomplete: false,
          });
        },
        ...(validateIncomplete && {
          fieldRef,
          onBlur: () => {
            const sections = fieldRef.current?.getSections() ?? [];
            setInputValidation((current) => ({
              value,
              muiError: current.value === value && current.muiError,
              incomplete:
                sections.some((section) => section.value === '') &&
                sections.some((section) => section.value !== ''),
            }));
          },
        }),
      },
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
