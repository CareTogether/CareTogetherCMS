import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useForkRef } from '@mui/material/utils';
import { DatePicker } from '@mui/x-date-pickers';
import type { GridFilterInputDateProps } from '@mui/x-data-grid-premium';

type Props = GridFilterInputDateProps & { filterDebounceMs?: number };

const minDate = new Date('0001-01-01T00:00:00');
const maxDate = new Date('9999-12-31T23:59:00');

function filterDateToPickerValue(value: unknown, timestamp: boolean) {
  if (value == null || value === '') return null;
  if (
    !(value instanceof Date) &&
    typeof value !== 'string' &&
    typeof value !== 'number'
  )
    return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (timestamp) return date;
  const localDate = new Date(0);
  localDate.setFullYear(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  localDate.setHours(0, 0, 0, 0);
  return localDate;
}

function pickerValueToFilterDate(date: Date | null, timestamp: boolean) {
  if (!date || Number.isNaN(date.getTime())) return undefined;
  if (timestamp) {
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);
    return localDate;
  }
  const utcDate = new Date(0);
  utcDate.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  utcDate.setUTCHours(0, 0, 0, 0);
  return utcDate;
}

export function DataGridFilterInputDate({
  item,
  applyValue,
  type,
  apiRef,
  focusElementRef,
  inputRef,
  disabled,
  disableDebounce = false,
  filterDebounceMs = 150,
  slotProps,
  headerFilterMenu,
  clearButton,
  tabIndex,
  onFocus,
  onBlur,
  className,
}: Props) {
  const timestamp = type === 'datetime-local';
  const [value, setValue] = useState(() =>
    filterDateToPickerValue(item.value, timestamp)
  );
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fieldInputRef = useForkRef(focusElementRef, inputRef);

  useEffect(() => {
    clearTimeout(timeout.current);
    setValue(filterDateToPickerValue(item.value, timestamp));
    return () => clearTimeout(timeout.current);
  }, [item.value, item.field, item.operator, item.id, timestamp]);

  function changeValue(
    date: Date | null,
    context: { validationError: unknown }
  ) {
    clearTimeout(timeout.current);
    setValue(date);
    const filterValue =
      context.validationError == null
        ? pickerValueToFilterDate(date, timestamp)
        : undefined;
    const nextItem = { ...item, value: filterValue };
    if (
      filterValue === undefined ||
      disableDebounce ||
      filterDebounceMs === 0
    ) {
      applyValue(nextItem);
      return;
    }
    timeout.current = setTimeout(() => applyValue(nextItem), filterDebounceMs);
  }

  const pickerProps = {
    value,
    onChange: changeValue,
    disabled,
    inputRef: fieldInputRef,
    minDate,
    maxDate,
    label:
      slotProps?.root?.label ??
      apiRef.current.getLocaleText('filterPanelInputLabel'),
    slotProps: {
      field: { clearable: true },
      textField: {
        fullWidth: true,
        size: slotProps?.root?.size ?? 'small',
        onFocus,
        onBlur,
        slotProps: { htmlInput: { tabIndex } },
      },
    },
    sx: { width: '100%', minWidth: 0 },
  } as const;

  return (
    <Box className={className} sx={{ width: '100%', minWidth: 0 }}>
      <DatePicker {...pickerProps} />
      {headerFilterMenu}
      {clearButton}
    </Box>
  );
}
