/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SS_ID_KINTAI_TOTALLING: string;
  readonly VITE_SS_ID_CATEGORY_MASTER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
