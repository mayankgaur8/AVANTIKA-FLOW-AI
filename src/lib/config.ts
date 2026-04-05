/**
 * API_BASE is the root URL of the Azure backend.
 *
 * In production (Vercel):  VITE_API_URL=https://avantika-workflow-ai.azurewebsites.net
 * Backward-compatible:     also supports VITE_API_BASE_URL (legacy key)
 * In local dev:            env is unset -> empty string -> Vite proxy handles /api -> localhost:3001
 *
 * Never hardcode the backend URL anywhere else. Import from here.
 */
export const API_BASE = (
	import.meta.env.VITE_API_URL ??
	import.meta.env.VITE_API_BASE_URL ??
	''
).replace(/\/$/, '');

/** Builds an absolute URL to the backend. Works for both fetch() and window.location redirects. */
export const buildApiUrl = (path: string): string => `${API_BASE}${path}`;
