import { Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import type { GridSlotProps } from '@mui/x-data-grid-premium';
import { useEffect, useRef } from 'react';
import type { ArrangementColumns } from './matrixColumnVisibility';

type ArrangementVisibility = {
  groups: readonly ArrangementColumns[];
  hidden: ReadonlySet<string>;
  disabled: boolean;
  onToggle: (id: string) => void;
};

declare module '@mui/x-data-grid' {
  interface ColumnsManagementPropsOverrides {
    arrangementVisibility?: ArrangementVisibility;
  }
}

export function MatrixColumnsManagement({
  arrangementVisibility,
}: GridSlotProps['columnsManagement']) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (arrangementVisibility?.groups.length === 0) panel.current?.focus();
  }, [arrangementVisibility?.groups.length]);
  if (!arrangementVisibility) return null;
  const { groups, hidden, disabled, onToggle } = arrangementVisibility;
  return (
    <Stack
      ref={panel}
      tabIndex={-1}
      role="group"
      aria-label="Arrangement visibility"
      sx={{
        p: 2,
        width: 'min(320px, calc(100vw - 32px))',
        boxSizing: 'border-box',
        maxHeight: '60vh',
        overflowY: 'auto',
      }}
    >
      {groups.length === 0 && (
        <Typography variant="body2">
          No valid arrangement types are available.
        </Typography>
      )}
      {groups.map((group, index) => (
        <FormControlLabel
          key={group.id}
          sx={{
            m: 0,
            alignItems: 'flex-start',
            '& .MuiFormControlLabel-label': { py: 1, overflowWrap: 'anywhere' },
          }}
          label={group.name}
          control={
            <Checkbox
              autoFocus={index === 0}
              checked={!hidden.has(group.id)}
              disabled={disabled}
              onChange={() => onToggle(group.id)}
            />
          }
        />
      ))}
    </Stack>
  );
}
