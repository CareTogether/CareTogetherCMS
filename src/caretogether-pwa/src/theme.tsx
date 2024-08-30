import { createTheme } from '@mui/material/styles';
import { amber } from '@mui/material/colors';
import { fontSize, typography } from '@mui/system';

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
    h3: {
      fontSize: '1.3rem',
      [createTheme().breakpoints.up('sm')]: {
        fontSize: '2rem',
      },
    },
  },
});
