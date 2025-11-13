/// <reference types="vite/client" />
// (Optionally list only the ones you use)
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  // add any other VITE_* keys here…
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}