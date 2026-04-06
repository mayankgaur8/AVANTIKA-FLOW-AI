/**
 * API_BASE_URL — root URL of the Azure backend.
 *
 * Production (Vercel):  VITE_API_URL=https://avantika-workflow-ai-fwdnhqd6c9d3hngn.centralindia-01.azurewebsites.net
 * Local dev:            leave unset — Vite proxy forwards /api → localhost:3001
 *
 * Env vars starting with VITE_ are injected at BUILD TIME by Vite.
 * Setting the var in Vercel requires a new deployment to take effect.
 */
const _raw = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

// Log on startup so you can open DevTools → Console and immediately see
// whether the Azure URL was baked in or is missing.
if (import.meta.env.PROD) {
  if (_raw) {
    console.info(`[config] VITE_API_URL → ${_raw}`);
  } else {
    console.error(
      '[config] ⚠ VITE_API_URL is not set. ' +
      'All API calls and OAuth redirects will be relative (hitting Vercel, not Azure). ' +
      'Add VITE_API_URL in Vercel → Settings → Environment Variables, then redeploy.'
    );
  }
}

export const API_BASE_URL = _raw;

const normalizeApiPath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

/**
 * Build a URL to the backend.
 * - Production with VITE_API_URL set → absolute Azure URL
 * - Local dev (no VITE_API_URL) → relative path, forwarded by Vite proxy
 * - Production WITHOUT VITE_API_URL → logs an error, falls back to relative
 *   (which will 404 on Vercel, but at least won't throw a silent JS crash)
 */
export const buildApiUrl = (path: string): string => {
  const normalizedPath = normalizeApiPath(path);
  if (API_BASE_URL) {
    return `${API_BASE_URL}${normalizedPath}`;
  }
  return normalizedPath;
};
