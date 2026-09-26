/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_TEST_HOOKS?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
