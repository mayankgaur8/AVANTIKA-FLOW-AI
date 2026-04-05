const POST_AUTH_REDIRECT_KEY = 'avantika_post_auth_redirect';

export const sanitizeRedirectPath = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//')) return null;
  return trimmed;
};

export const setPostAuthRedirect = (value: string | null | undefined) => {
  const next = sanitizeRedirectPath(value);
  if (!next) return;
  sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, next);
};

export const getPostAuthRedirect = () => sanitizeRedirectPath(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY));

export const consumePostAuthRedirect = () => {
  const value = getPostAuthRedirect();
  sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  return value;
};
