import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { AuthUser } from '../context/AuthContext';
import { sanitizeRedirectPath, setPostAuthRedirect, consumePostAuthRedirect } from '../lib/postAuthRedirect';

export const AuthCallbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing sign-in...');
  const { setOAuthInProgress, setSession, refresh } = useAuth();

  useEffect(() => {
    setOAuthInProgress();
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const error = params.get('error');
      const redirectTo = sanitizeRedirectPath(params.get('redirect_to'));
      const sourcePage = sanitizeRedirectPath(params.get('source_page'));
      const inferredFromSource = sourcePage && sourcePage.startsWith('/capture') ? '/capture/setup' : null;
      const intendedDestination = redirectTo || inferredFromSource || consumePostAuthRedirect();

      if (intendedDestination) {
        setPostAuthRedirect(intendedDestination);
      }

      if (error) {
        setMessage('Google sign-in failed. Please try again.');
        setTimeout(() => navigate('/?authError=1'), 1200);
        return;
      }

      if (!token) {
        setMessage('Missing token from auth callback.');
        setTimeout(() => navigate('/'), 1200);
        return;
      }

      try {
        const me = await api.me(token);
        const user = me.user as {
          status?: string;
          workspace_id?: string | null;
          email_verified?: boolean;
          is_onboarded?: boolean;
          provider?: string;
        };
        // Use setSession to atomically persist token + update AuthContext state
        // without making a second api.me() call (which would fail if server restarted)
        setSession(token, me.user as unknown as AuthUser);

        if (user.status === 'rejected' || user.status === 'blocked') {
          setMessage('Access is blocked. Redirecting...');
          setTimeout(() => navigate('/rejected-access', { replace: true }), 700);
          return;
        }

        // Google OAuth emails are verified by Google — never send them to the
        // email-verification screen. This is the frontend defence-in-depth check;
        // the backend should also set email_verified = true for Google users.
        const isGoogleUser = user.provider === 'google';

        if (!user.email_verified && !isGoogleUser) {
          setMessage('Check your email to verify your account...');
          setTimeout(() => navigate('/verify-email-pending', { replace: true }), 700);
          return;
        }

        // New user: is_onboarded is explicitly false → start post-login onboarding
        if (user.is_onboarded === false) {
          setMessage('Welcome! Setting up your workspace...');
          setTimeout(() => navigate('/onboarding/team', { replace: true }), 700);
          return;
        }

        // Legacy path: no workspace yet (existing users before is_onboarded flag)
        if (!user.workspace_id) {
          setMessage('Email verified. Continue team setup...');
          setTimeout(() => navigate('/welcome', { replace: true }), 700);
          return;
        }

        const destination = consumePostAuthRedirect() || intendedDestination || '/dashboard';
        setMessage('Sign-in successful. Redirecting...');
        setTimeout(() => navigate(destination, { replace: true }), 700);
      } catch {
        setMessage('Could not validate account session.');
        setTimeout(() => navigate('/'), 1200);
      }
    };

    run();
  }, [location.search, navigate, setOAuthInProgress, refresh]);

  return (
    <div className="min-h-screen bg-[#050c18] flex items-center justify-center px-6">
      <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl px-8 py-10 text-center max-w-md w-full">
        <Loader2 className="animate-spin mx-auto text-white mb-4" />
        <h1 className="text-white text-xl font-bold">Authenticating</h1>
        <p className="text-white/60 text-sm mt-2">{message}</p>
      </div>
    </div>
  );
};
