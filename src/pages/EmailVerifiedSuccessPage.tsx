import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { consumePostAuthRedirect } from '../lib/postAuthRedirect';

const META: Record<string, { title: string; body: string; icon: 'success' | 'error' | 'expired' }> = {
  verified: {
    title: 'Email verified!',
    body: 'Your email is confirmed. Continue to set up your workspace.',
    icon: 'success',
  },
  already_verified: {
    title: 'Already verified',
    body: 'Your email is already verified. Continue to your workspace.',
    icon: 'success',
  },
  expired_token: {
    title: 'Link expired',
    body: 'This verification link has expired. Request a new one from the verification page.',
    icon: 'expired',
  },
  invalid_token: {
    title: 'Invalid link',
    body: 'This verification link is not valid. Request a new one from the verification page.',
    icon: 'error',
  },
};

export const EmailVerifiedSuccessPage = () => {
  const navigate = useNavigate();
  const { state, setSession } = useAuth();
  const [params] = useSearchParams();
  const statusKey = useMemo(() => params.get('status') || 'verified', [params]);
  const meta = META[statusKey] ?? META['invalid_token'];

  // If the backend included a JWT in the redirect URL, bootstrap the session from it
  useEffect(() => {
    const token = params.get('token');
    if (!token) return;
    api.me(token).then(({ user }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSession(token, user as any);
    }).catch(() => { /* token invalid — user will see the page and click Continue manually */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  // After session is established, route them correctly
  useEffect(() => {
    if (state === 'onboarding_incomplete') navigate('/onboarding/team', { replace: true });
    if (state === 'email_verified_with_team') navigate(consumePostAuthRedirect() || '/dashboard', { replace: true });
  }, [state, navigate]);

  const isSuccess = meta.icon === 'success';
  const isExpired = meta.icon === 'expired';

  // Determine where "Continue" should land
  const continueHref = isSuccess ? '/onboarding/team' : '/verify-email-pending';

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)' }}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden text-center"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.06)' }}
      >
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)' }} />

        <div className="px-8 py-10">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: isSuccess
                  ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
                  : isExpired
                  ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
                  : 'linear-gradient(135deg, #fee2e2, #fecaca)',
              }}
            >
              {isSuccess && <CheckCircle2 size={30} className="text-emerald-600" />}
              {isExpired && <Clock size={30} className="text-amber-600" />}
              {!isSuccess && !isExpired && <XCircle size={30} className="text-red-500" />}
            </div>
          </div>

          <h1 className="text-2xl font-black text-gray-900 mb-3">{meta.title}</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">{meta.body}</p>

          <div className="flex flex-col gap-3">
            <Link
              to={continueHref}
              className="w-full flex items-center justify-center py-3.5 rounded-xl text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 4px 18px rgba(99,102,241,0.35)' }}
            >
              {isSuccess ? 'Continue to workspace →' : 'Request new verification email'}
            </Link>
            <Link
              to="/"
              className="w-full flex items-center justify-center py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Return home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
