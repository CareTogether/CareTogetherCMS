/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_APPINSIGHTS_CONNECTIONSTRING: string;
  readonly VITE_APP_API_HOST: string;
  readonly VITE_APP_AUTH_PROVIDER?: string;
  readonly VITE_APP_AUTH_CLIENT_ID: string;
  readonly VITE_APP_AUTH_AUTHORITY: string;
  readonly VITE_APP_AUTH_KNOWN_AUTHORITY: string;
  readonly VITE_APP_AUTH_REDIRECT_URI: string;
  readonly VITE_APP_AUTH_SCOPES: string;
  readonly VITE_APP_PUBLIC_POSTHOG_KEY?: string;
  readonly VITE_APP_PUBLIC_POSTHOG_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __CARETOGETHER_E2E_FEATURE_FLAGS__?: import('./featureFlags').FeatureFlagOverrides;
}
