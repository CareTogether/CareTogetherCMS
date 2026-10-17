import { useRef, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import type { FieldRef } from '@mui/x-date-pickers/models';

// Use the app's DateFns adapter/provider and date format. Keep validation local:
// the shared ValidateDatePicker treats partially cleared dates as empty values.
export function SupersededDatePicker({
  value,
  onChange,
  onErrorChange,
}: {
  value: Date | null;
  onChange: (value: Date | null) => void;
  onErrorChange: (error: boolean) => void;
}) {
  const fieldRef = useRef<FieldRef<Date | null>>(null);
  const [error, setError] = useState(false);
  function reportError(next: boolean) {
    setError(next);
    onErrorChange(next);
  }
  return (
    <DatePicker
      label="Superseded Date"
      format="MM/dd/yyyy"
      minDate={new Date(1900, 0, 1)}
      value={value}
      onChange={(date, context) => {
        onChange(date);
        reportError(context.validationError != null);
      }}
      onError={(validationError) => reportError(validationError != null)}
      slotProps={{
        field: {
          fieldRef,
          clearable: true,
          onClear: () => {
            onChange(null);
            reportError(false);
          },
          onBlur: () => {
            const sections = fieldRef.current?.getSections() ?? [];
            if (
              sections.some((section) => section.value !== '') &&
              sections.some((section) => section.value === '')
            ) {
              reportError(true);
            } else if (sections.every((section) => section.value === '')) {
              reportError(false);
            }
          },
        },
        textField: {
          fullWidth: true,
          error,
          helperText: error ? 'Enter a complete, valid date.' : undefined,
        },
      }}
    />
  );
}
