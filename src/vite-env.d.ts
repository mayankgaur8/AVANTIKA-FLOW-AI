/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Azure backend base URL. Set in Vercel env vars. Empty in local dev (Vite proxy handles /api). */
  readonly VITE_API_URL?: string;
  /** Legacy alias — same value as VITE_API_URL. Kept for backward compatibility. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
