/**
 * API_BASE_URL is the root URL of the backend API.
 *
 * In production (Vercel):  VITE_API_URL=https://your-backend.azurewebsites.net
 * In local dev:            VITE_API_URL is unset -> empty string -> Vite proxy handles /api -> localhost:3001
 *
 * Never hardcode backend URLs anywhere else. Import from here.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

const normalizeApiPath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

/** Builds a backend URL for both fetch() and browser redirects. */
export const buildApiUrl = (path: string): string => {
	const normalizedPath = normalizeApiPath(path);

	if (API_BASE_URL) {
		return `${API_BASE_URL}${normalizedPath}`;
	}

	if (import.meta.env.PROD) {
		throw new Error('Missing VITE_API_URL in production. Set it to the Azure backend origin.');
	}

	return normalizedPath;
};
