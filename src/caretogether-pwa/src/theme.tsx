import { createTheme } from '@mui/material/styles';
import { amber } from '@mui/material/colors';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#00838f',
    },
    secondary: amber /*{
      main: amber//'#ffc400'
    }*/,
  },
  typography: {
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.0075em',
    },
    h3: {
      fontSize: '1.17rem',
      fontWeight: 700,
    },
  },
});
