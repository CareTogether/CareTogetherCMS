import { Box, MenuItem, Select } from '@mui/material';
import { type ReactNode } from 'react';
import {
  requirementWindowDays,
  type RequirementWindowDays,
} from './dashboardPreferences';

export type SnoozeKind = 'upcoming' | 'pastDue';

export function NextDaysSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: RequirementWindowDays;
  onChange: (days: RequirementWindowDays) => void;
}) {
  return (
    <Select
      size="small"
      value={value}
      inputProps={{ 'aria-label': label }}
      sx={{ ml: { sm: 'auto' }, maxWidth: '100%' }}
      onChange={({ target: { value: next } }) => {
        const days = requirementWindowDays.find(
          (option) => String(option) === String(next)
        );
        if (days) onChange(days);
      }}
    >
      {requirementWindowDays.map((days) => (
        <MenuItem key={days} value={days}>
          Next {days} days
        </MenuItem>
      ))}
    </Select>
  );
}

export function DashboardColumns({
  upcoming,
  notes,
  pastDue,
  approvals,
}: {
  upcoming: ReactNode;
  notes: ReactNode;
  pastDue: ReactNode;
  approvals: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'minmax(0, 1fr)',
          lg: 'minmax(0, 3fr) minmax(0, 2fr)',
        },
        alignItems: { xs: 'start', lg: 'stretch' },
        gap: { xs: 2, lg: 2.5 },
      }}
    >
      {pastDue}
      {upcoming}
      {notes}
      {approvals}
    </Box>
  );
}
