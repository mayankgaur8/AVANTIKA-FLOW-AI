import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { authStore } from '../lib/auth';

export type AuthState =
  | 'anonymous'
  | 'oauth_in_progress'
  | 'authenticated_unverified'
  | 'email_verification_pending'
  | 'onboarding_incomplete'
  | 'email_verified_no_team'
  | 'email_verified_with_team'
  | 'rejected_or_blocked';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  status: string;
  email_verified: boolean;
  team_name?: string | null;
  workspace_id?: string | null;
  avatar_url?: string | null;
  is_onboarded?: boolean;
  /** 'google' | 'email' — set by backend on OAuth login */
  provider?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  state: AuthState;
  loading: boolean;
  token: string | null;
  setOAuthInProgress: () => void;
  setSession: (token: string, user: AuthUser) => void;
  refresh: () => Promise<AuthUser | null>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const deriveState = (user: AuthUser | null): AuthState => {
  if (!user) return 'anonymous';
  if (user.status === 'rejected' || user.status === 'blocked') return 'rejected_or_blocked';
  if (!user.email_verified) return 'email_verification_pending';
  // is_onboarded === false means explicitly new user; undefined = legacy user (skip onboarding)
  if (user.is_onboarded === false) return 'onboarding_incomplete';
  if (!user.workspace_id) return 'email_verified_no_team';
  return 'email_verified_with_team';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(authStore.getUser<AuthUser>());
  const [token, setToken] = useState<string | null>(authStore.getToken());
  const [state, setState] = useState<AuthState>(deriveState(authStore.getUser<AuthUser>()));
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const nextToken = authStore.getToken();
    setToken(nextToken);

    if (!nextToken) {
      setUser(null);
      setState('anonymous');
      setLoading(false);
      return null;
    }

    try {
      const result = await api.me(nextToken);
      const me = result.user as unknown as AuthUser;
      authStore.save(nextToken, me);
      setUser(me);
      setState(deriveState(me));
      return me;
    } catch {
      authStore.clear();
      setUser(null);
      setToken(null);
      setState('anonymous');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const setOAuthInProgress = () => {
    setState('oauth_in_progress');
    setLoading(false);
  };

  /** Directly set auth state from a token + user object without an extra API call. */
  const setSession = (newToken: string, newUser: AuthUser) => {
    authStore.save(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
    setState(deriveState(newUser));
    setLoading(false);
  };

  const signOut = () => {
    authStore.clear();
    setUser(null);
    setToken(null);
    setState('anonymous');
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ user, state, loading, token, setOAuthInProgress, setSession, refresh, signOut }), [user, state, loading, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
