import { createTheme } from '@mui/material/styles';
import { theme } from './theme';

const fontFamily = '"Poppins", "Helvetica", "Arial", sans-serif';

export const v2TypographyTheme = createTheme(theme, {
  typography: {
    fontFamily,
    ...Object.fromEntries(
      Object.entries(theme.typography)
        .filter(
          ([, value]) =>
            typeof value === 'object' &&
            value !== null &&
            'fontFamily' in value &&
            value.fontFamily !== 'inherit'
        )
        .map(([variant, value]) => [variant, { ...value, fontFamily }])
    ),
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { fontFamily },
      },
    },
  },
});
