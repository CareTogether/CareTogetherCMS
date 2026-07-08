import { Box, Stack, Typography } from '@mui/material';
import { type ReactNode } from 'react';

export function FamilyMemberDrawerSectionV2({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <Stack
      spacing={1}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 1.5,
      }}
    >
      <Box>
        <Typography variant="subtitle2">{title}</Typography>
        {description && (
          <Typography color="text.secondary" variant="caption">
            {description}
          </Typography>
        )}
      </Box>
      {children}
    </Stack>
  );
}

export function FamilyMemberDrawerEmptyStateV2({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Typography color="text.secondary" variant="body2">
      {children}
    </Typography>
  );
}

export function FamilyMemberDrawerDetailFieldV2({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <Box>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography
        className="ph-unmask"
        component="div"
        variant="body2"
        sx={{ fontWeight: 600 }}
      >
        {children || '-'}
      </Typography>
    </Box>
  );
}
