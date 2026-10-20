import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { v2Typography } from '../Families/v2Typography';

type Props = {
  title: string;
  description: string;
  actions?: ReactNode;
  titleComponent?: 'h1' | 'h4';
};

export function ResponsivePageHeader({
  title,
  description,
  actions,
  titleComponent = 'h4',
}: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: 1,
        pt: { xs: 1, sm: 2 },
        flexShrink: 0,
        minWidth: 0,
      }}
    >
      <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
        <Typography
          className="ph-unmask"
          {...v2Typography.pageTitle}
          component={titleComponent}
        >
          {title}
        </Typography>
        <Typography
          className="ph-unmask"
          {...v2Typography.secondaryValue}
          sx={{ ...v2Typography.secondaryValue.sx, mt: 0.5 }}
        >
          {description}
        </Typography>
      </Box>
      {actions && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1,
            ml: 'auto',
            minWidth: 0,
            maxWidth: '100%',
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  );
}
