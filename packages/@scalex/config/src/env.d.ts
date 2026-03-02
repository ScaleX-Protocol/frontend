interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_INDEXER_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
