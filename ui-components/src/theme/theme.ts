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
      fontWeight: 600,
    },
    h2: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: "0.0075em",
    },
    h3: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
      fontSize: "1.17rem",
      fontWeight: 700,
    },
    h4: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
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
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
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
  },
});
