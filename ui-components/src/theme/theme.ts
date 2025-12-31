import { createTheme } from "@mui/material/styles";

/**
 * CareTogether MUI Theme
 *
 * Primary color: #07666C (teal)
 * Primary dark: #00616F
 * Secondary: #D32F2F (red)
 * Background: #F6FCFC (light cyan)
 * Border radius: 8px
 * Font: Poppins
 */
export const theme = createTheme({
  palette: {
    primary: {
      main: "#07666C",
      dark: "#00616F",
      light: "#338a8f",
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
    fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
      fontSize: "40px",
      fontWeight: 500,
      lineHeight: 1.167,
      letterSpacing: "-1.5px",
    },
    h2: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
      fontSize: "32px",
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: "-0.5px",
    },
    h3: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
      fontSize: "28px",
      fontWeight: 500,
      lineHeight: 1.25,
      letterSpacing: "0px",
    },
    h4: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
      fontSize: "22px",
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: "0.25px",
    },
    h5: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
      fontSize: "20px",
      fontWeight: 500,
      lineHeight: 1.35,
      letterSpacing: "0px",
    },
    h6: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
      fontSize: "16px",
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: "0.15px",
    },
    body1: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
    },
    body2: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
    },
    button: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
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
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          border: "1px solid",
          borderColor: theme.palette.grey[300],
        }),
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
