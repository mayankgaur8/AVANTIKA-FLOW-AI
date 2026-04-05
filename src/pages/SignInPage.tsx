import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { api } from '../lib/api';
import { authStore } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { sanitizeRedirectPath, setPostAuthRedirect, consumePostAuthRedirect } from '../lib/postAuthRedirect';
import { startGoogleOAuth } from '../lib/oauth';

export const SignInPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const stateRedirect = sanitizeRedirectPath((location.state as { redirectTo?: string } | null)?.redirectTo);
  const queryRedirect = sanitizeRedirectPath(new URLSearchParams(location.search).get('redirect'));
  const redirectTo = stateRedirect || queryRedirect;

  useEffect(() => {
    if (redirectTo) setPostAuthRedirect(redirectTo);
  }, [redirectTo]);

  const onSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.login({ email, password });
      authStore.save(response.token, response.user);
      const user = response.user as { status?: string; workspace_id?: string | null; email_verified?: boolean; is_onboarded?: boolean };
      const pendingRedirect = redirectTo || consumePostAuthRedirect();
      await refresh();

      if (user.status === 'rejected' || user.status === 'blocked') {
        navigate('/rejected-access');
        return;
      }
      if (!user.email_verified) {
        setPostAuthRedirect(pendingRedirect);
        navigate('/verify-email-pending');
        return;
      }
      if (user.is_onboarded === false) {
        setPostAuthRedirect(pendingRedirect);
        navigate('/onboarding/team');
        return;
      }
      if (!user.workspace_id) {
        setPostAuthRedirect(pendingRedirect);
        navigate('/welcome');
        return;
      }
      navigate(pendingRedirect || '/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignIn = () => {
    startGoogleOAuth({
      sourcePage: location.pathname,
      ctaClicked: 'signin_google',
      campaignSource: new URLSearchParams(location.search).get('utm_source') || '',
      redirectTo: redirectTo || '',
    });
  };

  return (
    <div className="min-h-screen" style={{ background: '#050c18' }}>
      <Navigation />
      <main className="max-w-md mx-auto px-6 py-20">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
          <h1 className="text-3xl text-white font-black">Sign in</h1>
          <p className="text-white/65 text-sm mt-2">Access your workspace and AI workflow insights.</p>

          <button onClick={onGoogleSignIn} className="mt-6 w-full rounded-xl border border-white/20 text-white py-3 text-sm font-semibold hover:bg-white/10">
            Sign in with Google
          </button>

          <div className="my-4 h-px bg-white/10" />

          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            className="w-full mb-3 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/40" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password"
            className="w-full mb-3 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/40" />

          {error ? <p className="text-red-400 text-sm mb-3">{error}</p> : null}

          <button onClick={onSignIn} disabled={loading || !email || !password}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white py-3 text-sm font-semibold disabled:opacity-50">
            {loading ? <span className="inline-flex items-center"><Loader2 size={14} className="animate-spin mr-2" />Signing in...</span> : 'Sign in'}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};
