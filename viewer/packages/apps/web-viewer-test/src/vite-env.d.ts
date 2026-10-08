/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly IMJS_SZEWTWIN_ID?: string;
  readonly IMJS_IVAULT_ID?: string;
  readonly IVJS_AUTH_CLIENT_CLIENT_ID: string;
  readonly IVJS_AUTH_CLIENT_SCOPES: string;
  readonly IVJS_AUTH_CLIENT_REDIRECT_URI: string;
  readonly IVJS_AUTH_CLIENT_LOGOUT_URI: string;
  readonly IVJS_AUTH_CLIENT_CHANGESET_ID?: string;
  readonly IVJS_BING_MAPS_KEY?: string;
  readonly IVJS_URL_PREFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}