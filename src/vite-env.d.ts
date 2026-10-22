/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FORMSPREE_FORM_ID: string
  readonly VITE_GISCUS_REPO?: string
  readonly VITE_GISCUS_REPO_ID?: string
  readonly VITE_GISCUS_CATEGORY?: string
  readonly VITE_GISCUS_CATEGORY_ID: string

  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
