import { createTheme } from "@mui/material/styles";
import "./theme.d";

/**
 * CareTogether MUI Theme
 *
 * Primary color: #26A3AB (teal)
 * Primary dark: #07666C (deep teal - available as "primaryDark" color prop)
 * Secondary: #D32F2F (red)
 * Tertiary: #00616F (medium teal - available as "tertiary" color prop)
 * Background: #F6FCFC (light cyan)
 * Border radius: 8px for shapes, 24px for buttons
 * Font: Inter
 */
export const theme = createTheme({
  palette: {
    primary: {
      main: "#26A3AB",
      dark: "#07666C",
      contrastText: "#ffffff",
    },
    primaryDark: {
      main: "#07666C",
      light: "#26A3AB",
      dark: "#065C61",
      contrastText: "#ffffff",
    },
    tertiary: {
      main: "#00616F",
      light: "#26A3AB",
      dark: "#005764",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#D32F2F",
      light: "#ff6659",
      dark: "#9a0007",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#EF6C00",
    },
    background: {
      default: "#F6FCFC",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontSize: "40px",
      fontWeight: 500,
      lineHeight: 1.167,
      letterSpacing: "-1.5px",
    },
    h2: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontSize: "32px",
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: "-0.5px",
    },
    h3: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontSize: "28px",
      fontWeight: 500,
      lineHeight: 1.25,
      letterSpacing: "0px",
    },
    h4: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontSize: "22px",
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: "0.25px",
    },
    h5: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontSize: "20px",
      fontWeight: 500,
      lineHeight: 1.35,
      letterSpacing: "0px",
    },
    h6: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontSize: "16px",
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: "0.15px",
    },
    body1: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    },
    body2: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    },
    button: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
    },
    subtitle1: {
      fontSize: "16px",
      fontWeight: 600,
      letterSpacing: "0.17px",
    },
    subtitle2: {
      color: "#212121",
      fontSize: "14px",
      fontWeight: 600,
      letterSpacing: "0.17px",
    },
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.primary.main,
          textDecoration: "none",
          fontWeight: 500,
          "&:hover, &:focus-visible": {
            textDecoration: "underline",
          },
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          textTransform: "none",
          fontWeight: 500,
          lineHeight: 1.5,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& a": {
            color: theme.palette.primary.dark,
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          },
        }),
      },
    },
  },
});
