import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useForkRef } from '@mui/material/utils';
import { DatePicker } from '@mui/x-date-pickers';
import type { GridFilterInputDateProps } from '@mui/x-data-grid-premium';
import {
  filterDateToPickerValue,
  pickerValueToFilterDate,
} from './dataGridDateFilterUtils';

type Props = GridFilterInputDateProps & { filterDebounceMs?: number };

const minDate = new Date('0001-01-01T00:00:00');
const maxDate = new Date('9999-12-31T23:59:00');

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
