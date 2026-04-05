const AUTH_TOKEN_KEY = 'avantika_auth_token';
const AUTH_USER_KEY = 'avantika_auth_user';

export const authStore = {
  save(token: string, user: unknown) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
  getUser<T = Record<string, unknown>>() {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  clear() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },
};
