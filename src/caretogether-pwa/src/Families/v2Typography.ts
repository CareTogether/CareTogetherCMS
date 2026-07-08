import type { SxProps, Theme, TypographyProps } from '@mui/material';

type V2TypographyToken = {
  sx?: SxProps<Theme>;
  variant: TypographyProps['variant'];
};

export const v2Typography = {
  pageTitle: {
    variant: 'h4',
  },
  workspaceTitle: {
    variant: 'h5',
  },
  sectionTitle: {
    variant: 'subtitle2',
  },
  primaryValue: {
    variant: 'body1',
    sx: { fontWeight: 600 },
  },
  secondaryValue: {
    variant: 'body2',
    sx: { color: 'text.secondary' },
  },
  fieldLabel: {
    variant: 'caption',
    sx: { color: 'text.secondary' },
  },
  browserCell: {
    variant: 'body1',
  },
  browserSecondary: {
    variant: 'body2',
  },
} satisfies Record<string, V2TypographyToken>;
