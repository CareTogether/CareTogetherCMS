import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from "react-router-dom";
import { RecoilRoot } from 'recoil';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns as DateAdapter } from '@mui/x-date-pickers/AdapterDateFns';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { amber } from '@mui/material/colors';
import AppAuthWrapper from './AppAuthWrapper';
import RequestBackdrop from './Components/RequestBackdrop';
import ErrorBackdrop from './Components/ErrorBackdrop';
import reportWebVitals from './reportWebVitals';

const theme = createTheme({
  palette: {
    primary: {
      main: '#00838f',
    },
    secondary: amber,
    tonalOffset: 0.6
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
        <LocalizationProvider dateAdapter={DateAdapter}>
          <RecoilRoot>
            <Router>
              <AppAuthWrapper />
            </Router>
            <RequestBackdrop />
            <ErrorBackdrop />
          </RecoilRoot>
        </LocalizationProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
