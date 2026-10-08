/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly IVJS_VIEWER_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}