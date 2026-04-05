import { useEffect, useMemo } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { authStore } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { NameYourTeamModal } from '../components/NameYourTeamModal';

export const WelcomePage = () => {
  const navigate = useNavigate();
  const { state, token, user: authUser, refresh } = useAuth();
  const user = useMemo(() => authStore.getUser<{ name?: string; email?: string }>(), []);

  useEffect(() => {
    if (state === 'rejected_or_blocked') navigate('/rejected-access', { replace: true });
    if (state === 'authenticated_unverified' || state === 'email_verification_pending') navigate('/verify-email-pending', { replace: true });
    if (state === 'email_verified_with_team') navigate('/dashboard', { replace: true });
  }, [state, navigate]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen" style={{ background: '#050c18' }}>
      <Navigation />
      <main className="max-w-4xl mx-auto px-6 py-24">
        <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 size={26} className="text-emerald-600" />
          </div>
          <h1 className="text-4xl font-black text-white">Welcome {user.name || 'to Avantika Flow AI'}</h1>
          <p className="text-white/65 mt-3">Your account is ready. Start capturing workflows and optimizing team performance.</p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/capture" className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold inline-flex items-center justify-center gap-2">
              Explore Capture <ArrowRight size={14} />
            </Link>
            <Link to="/optimize" className="px-6 py-3 rounded-xl border border-white/20 text-white/85">
              View Optimize
            </Link>
          </div>
        </section>
      </main>
      {token ? (
        <NameYourTeamModal
          isOpen={state === 'email_verified_no_team'}
          token={token}
          initialValue={authUser?.team_name || ''}
          onComplete={async () => {
            await refresh();
            navigate('/dashboard', { replace: true });
          }}
        />
      ) : null}
      <Footer />
    </div>
  );
};
