import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type WorkspaceSectionV2Props = {
  actions?: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  title: string;
};

export function WorkspaceSectionV2({
  actions,
  children,
  description,
  title,
}: WorkspaceSectionV2Props) {
  return (
    <Stack
      spacing={1.25}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: { xs: 1.25, sm: 1.5 },
        minWidth: 0,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          minWidth: 0,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2">{title}</Typography>
          {description && (
            <Typography color="text.secondary" variant="caption">
              {description}
            </Typography>
          )}
        </Box>
        {actions && (
          <Box sx={{ flexShrink: 0 }}>
            {actions}
          </Box>
        )}
      </Stack>
      {children}
    </Stack>
  );
}
