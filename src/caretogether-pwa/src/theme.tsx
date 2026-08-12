import { createTheme } from '@mui/material/styles';
import { amber } from '@mui/material/colors';
import { drawerClasses } from '@mui/material/Drawer';
import {
  DESKTOP_BOTTOM_SAFE_AREA,
  MOBILE_BOTTOM_SAFE_AREA,
} from './Shell/shellLayoutConstants';

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
  components: {
    MuiDrawer: {
      styleOverrides: {
        root: ({ theme }) => ({
          [`&.${drawerClasses.anchorRight} .${drawerClasses.paper}, &.${drawerClasses.anchorBottom} .${drawerClasses.paper}`]:
            {
              paddingBottom: `${MOBILE_BOTTOM_SAFE_AREA}px`,
              [theme.breakpoints.up('md')]: {
                paddingBottom: `${DESKTOP_BOTTOM_SAFE_AREA}px`,
              },
            },
        }),
      },
    },
  },
});
