/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_APPINSIGHTS_CONNECTIONSTRING: string
  readonly VITE_APP_API_HOST: string
  readonly VITE_APP_AUTH_CLIENT_ID: string
  readonly VITE_APP_AUTH_AUTHORITY: string
  readonly VITE_APP_AUTH_KNOWN_AUTHORITY: string
  readonly VITE_APP_AUTH_REDIRECT_URI: string
  readonly VITE_APP_AUTH_SCOPES: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
