import { MenuItem, Stack, TextField } from '@mui/material';
import {
  useGridApiContext,
  type GridRenderEditCellParams,
} from '@mui/x-data-grid-premium';
import { useEffect, useRef, useState } from 'react';
import {
  parseValidity,
  parseValidityAmount,
  toTimeSpanString,
} from './policyUtils';
import type { ValidityUnit } from './types';

export function ActionValidityEditCell({
  id,
  field,
  value,
  hasFocus,
  isProcessingProps,
}: GridRenderEditCellParams) {
  const apiRef = useGridApiContext();
  const initial = parseValidity(value);
  const [amount, setAmount] = useState(value ? initial.validityAmount : '');
  const [unit, setUnit] = useState(initial.validityUnit);
  const input = useRef<HTMLInputElement>(null);
  const invalid = amount !== '' && parseValidityAmount(amount) === undefined;
  useEffect(() => {
    if (hasFocus) input.current?.focus();
  }, [hasFocus]);

  function update(nextAmount: string, nextUnit: ValidityUnit) {
    setAmount(nextAmount);
    setUnit(nextUnit);
    void apiRef.current.setEditCellValue({
      id,
      field,
      value:
        nextAmount === ''
          ? undefined
          : (toTimeSpanString(true, nextAmount, nextUnit) ?? 'invalid'),
    });
  }

  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{ width: '100%' }}
      onKeyDown={(event) => {
        const amountHasFocus = document.activeElement === input.current;
        if (
          event.key === 'Tab' &&
          ((amountHasFocus && !event.shiftKey) ||
            (!amountHasFocus && event.shiftKey))
        )
          event.stopPropagation();
      }}
    >
      <TextField
        inputRef={input}
        size="small"
        type="number"
        value={amount}
        error={invalid}
        disabled={isProcessingProps}
        placeholder="None"
        slotProps={{
          htmlInput: { 'aria-label': 'Validity amount', min: 1, step: 1 },
        }}
        onChange={(event) => update(event.target.value, unit)}
        sx={{ minWidth: 75 }}
      />
      <TextField
        select
        size="small"
        value={unit}
        disabled={isProcessingProps}
        slotProps={{
          select: { inputProps: { 'aria-label': 'Validity unit' } },
        }}
        onChange={(event) => update(amount, event.target.value as ValidityUnit)}
        sx={{ minWidth: 95 }}
      >
        <MenuItem value="days">Days</MenuItem>
        <MenuItem value="months">Months</MenuItem>
        <MenuItem value="years">Years</MenuItem>
      </TextField>
    </Stack>
  );
}
