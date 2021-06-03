import React from 'react';
import ReactDOM from 'react-dom';
import { AppInsightsContext } from "@microsoft/applicationinsights-react-js";
import { aiReact } from './Components/AppInsights';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { CssBaseline } from '@material-ui/core';

ReactDOM.render(
  <React.StrictMode>
    <AppInsightsContext.Provider value={aiReact}>
      <CssBaseline>
        <App />
      </CssBaseline>
    </AppInsightsContext.Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
