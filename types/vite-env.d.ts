/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SS_ID_KINTAI_TOTALLING: string;
  readonly VITE_SS_ID_CATEGORY_MAIN: string;
  readonly VITE_SS_ID_CATEGORY_SUB: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
