/// <reference types="react-scripts" />

declare namespace NodeJS {
  export interface ProcessEnv {
    REACT_APP_AUTH_CLIENT_ID: string;
    REACT_APP_AUTH_AUTHORITY: string;
    REACT_APP_AUTH_KNOWN_AUTHORITY: string;
    REACT_APP_AUTH_REDIRECT_URI: string;
    REACT_APP_AUTH_SCOPES: string;
    VITE_APP_FEATUREBASE_APP_ID: string;
  }
}

declare const __APP_VERSION__: string;
