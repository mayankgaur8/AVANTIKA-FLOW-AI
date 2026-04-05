import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Mail, CheckCircle2, AlertCircle, ArrowLeft,
  ExternalLink, RefreshCw, Pencil, X,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { api } from '../lib/api';
import { authStore } from '../lib/auth';
import { useAuth } from '../context/AuthContext';

const COOLDOWN_SECONDS = 60;

// ─── Inbox opener ─────────────────────────────────────────────────────────────

const INBOX_PROVIDERS: { match: (d: string) => boolean; label: string; url: string }[] = [
  { match: (d) => d === 'gmail.com',                                                label: 'Open Gmail',        url: 'https://mail.google.com' },
  { match: (d) => ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(d), label: 'Open Outlook',      url: 'https://outlook.live.com' },
  { match: (d) => d === 'yahoo.com' || d.startsWith('yahoo.'),                     label: 'Open Yahoo Mail',   url: 'https://mail.yahoo.com' },
  { match: (d) => d === 'icloud.com' || d === 'me.com',                            label: 'Open iCloud Mail',  url: 'https://www.icloud.com/mail' },
  { match: (d) => d === 'proton.me' || d === 'protonmail.com',                     label: 'Open Proton Mail',  url: 'https://mail.proton.me' },
  { match: (d) => d === 'aol.com',                                                 label: 'Open AOL Mail',     url: 'https://mail.aol.com' },
];

function getInboxInfo(email: string): { label: string; url: string } {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  const provider = INBOX_PROVIDERS.find((p) => p.match(domain));
  return provider ?? { label: 'Open inbox', url: `https://mail.${domain}` };
}

// ─── Email-domain icon (simple coloured dot) ──────────────────────────────────

function ProviderDot({ email }: { email: string }) {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  const color =
    domain === 'gmail.com'   ? '#ea4335' :
    domain.includes('outlook') || domain.includes('hotmail') ? '#0078d4' :
    domain.includes('yahoo') ? '#6001d2' :
    '#6b7280';

  return <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const VerifyEmailPendingPage = () => {
  const navigate = useNavigate();
  const { state, user: authUser, token: authToken, refresh } = useAuth();

  // Redirect verified / already-onboarded users away immediately
  useEffect(() => {
    // Google users (REQUIRE_EMAIL_VERIFICATION_FOR_GOOGLE=false) are always verified
    if (authUser?.provider === 'google' && authUser.email_verified) {
      if (state === 'onboarding_incomplete') navigate('/onboarding/team', { replace: true });
      else if (state === 'email_verified_with_team') navigate('/dashboard', { replace: true });
      else navigate('/welcome', { replace: true });
    }
    if (state === 'email_verified_with_team') navigate('/dashboard', { replace: true });
    if (state === 'onboarding_incomplete') navigate('/onboarding/team', { replace: true });
  }, [authUser?.provider, authUser?.email_verified, state, navigate]);

  // Prefer live auth context; fall back to localStorage
  const storedUser = authStore.getUser<{ email?: string; provider?: string }>();
  const [email, setEmail]   = useState(authUser?.email ?? storedUser?.email ?? '');
  const token               = authToken ?? authStore.getToken();

  const inbox               = email ? getInboxInfo(email) : null;

  // Resend cooldown
  const [sending, setSending]       = useState(false);
  const [cooldown, setCooldown]     = useState(0);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const intervalRef                 = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown <= 0) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [cooldown]);

  const resend = async () => {
    if (!token || sending || cooldown > 0) return;
    setSending(true);
    setResendError('');
    setSentSuccess(false);
    try {
      await api.resendVerification(token);
      setSentSuccess(true);
      setCooldown(COOLDOWN_SECONDS);
    } catch (e) {
      setResendError(e instanceof Error ? e.message : 'Failed to resend. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Inline change-email
  const [changingEmail, setChangingEmail]   = useState(false);
  const [newEmail, setNewEmail]             = useState('');
  const [changeLoading, setChangeLoading]   = useState(false);
  const [changeError, setChangeError]       = useState('');

  const submitEmailChange = async () => {
    if (!token || changeLoading) return;
    const trimmed = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setChangeError('Please enter a valid email address.');
      return;
    }
    setChangeLoading(true);
    setChangeError('');
    try {
      await api.changePendingEmail(token, trimmed);
      // Update local state with new email; refresh auth to pick up backend change
      setEmail(trimmed);
      setSentSuccess(true);
      setCooldown(COOLDOWN_SECONDS);
      setChangingEmail(false);
      setNewEmail('');
      await refresh();
    } catch (e) {
      setChangeError(e instanceof Error ? e.message : 'Could not update email. Please try again.');
    } finally {
      setChangeLoading(false);
    }
  };

  const resendDisabled = !token || sending || cooldown > 0;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[460px] bg-white rounded-3xl overflow-hidden"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.06)' }}
      >
        {/* Top gradient bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)' }} />

        <div className="px-8 pt-8 pb-8">
          {/* Logo */}
              <BrandLogo
                className="mb-8"
                imageClassName="h-10 w-10 object-cover object-top rounded-xl ring-1 ring-gray-200 shadow-[0_0_14px_rgba(59,130,246,0.25)]"
                wordmarkClassName="font-bold text-gray-900 text-base tracking-tight"
              />

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #dbeafe, #ede9fe)' }}
            >
              <Mail size={28} className="text-blue-600" />
            </motion.div>
          </div>

          {/* Headline */}
          <h1 className="text-2xl font-black text-gray-900 text-center mb-2">Check your inbox</h1>
          <p className="text-gray-500 text-sm text-center leading-relaxed mb-3">
            We sent a verification link to:
          </p>

          {/* Email chip with change trigger */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {email && <ProviderDot email={email} />}
            <span className="font-semibold text-gray-800 text-sm">{email || 'your email'}</span>
            <button
              onClick={() => { setChangingEmail(true); setNewEmail(email); }}
              className="text-violet-500 hover:text-violet-700 transition-colors"
              aria-label="Change email"
            >
              <Pencil size={13} />
            </button>
          </div>

          {/* Inline change-email form */}
          <AnimatePresence>
            {changingEmail && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="mt-3 p-4 rounded-2xl border border-violet-200 bg-violet-50">
                  <p className="text-xs font-semibold text-violet-700 mb-2">Update email address</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      autoFocus
                      placeholder="new@email.com"
                      value={newEmail}
                      onChange={(e) => { setNewEmail(e.target.value); setChangeError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && submitEmailChange()}
                      className="flex-1 px-3 py-2 text-sm rounded-xl border-2 outline-none transition-all"
                      style={{
                        borderColor: changeError ? '#ef4444' : '#c4b5fd',
                        boxShadow: changeError ? '0 0 0 3px rgba(239,68,68,0.1)' : '0 0 0 3px rgba(139,92,246,0.08)',
                      }}
                    />
                    <button
                      onClick={submitEmailChange}
                      disabled={changeLoading}
                      className="px-3 py-2 rounded-xl text-white text-xs font-bold transition-all"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                    >
                      {changeLoading ? <Loader2 size={13} className="animate-spin" /> : 'Update'}
                    </button>
                    <button
                      onClick={() => { setChangingEmail(false); setChangeError(''); }}
                      className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {changeError && (
                    <p className="text-xs text-red-500 font-medium mt-1.5">{changeError}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-gray-400 text-xs text-center mb-6 leading-relaxed">
            Click the link in the email to verify your account.{' '}
            <strong className="text-gray-500">Also check your spam/promotions folder.</strong>
          </p>

          {/* Feedback banners */}
          <AnimatePresence>
            {sentSuccess && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 text-sm font-medium"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}
              >
                <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-500" />
                Verification email sent! Check your inbox and spam folder.
              </motion.div>
            )}
            {resendError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 text-sm font-medium"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
              >
                <AlertCircle size={16} className="flex-shrink-0 text-red-500" />
                {resendError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary CTA — Open inbox */}
          {inbox && (
            <a
              href={inbox.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-white font-bold text-sm mb-3 transition-all"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                boxShadow: '0 4px 18px rgba(99,102,241,0.35)',
              }}
            >
              <ExternalLink size={15} strokeWidth={2.5} />
              {inbox.label}
            </a>
          )}

          {/* Resend button */}
          <button
            onClick={resend}
            disabled={resendDisabled}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all mb-3 border"
            style={{
              borderColor: resendDisabled ? '#e5e7eb' : '#c4b5fd',
              background:  resendDisabled ? '#f9fafb' : '#faf5ff',
              color:       resendDisabled ? '#9ca3af' : '#7c3aed',
              cursor:      resendDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {sending
              ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
              : cooldown > 0
              ? <><RefreshCw size={14} /> Resend in {cooldown}s</>
              : <><RefreshCw size={14} /> Resend verification email</>
            }
          </button>

          {/* Return home */}
          <Link
            to="/"
            className="w-full flex items-center justify-center py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={13} className="mr-1.5" /> Return home
          </Link>

          {/* Help note */}
          <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
            Wrong account?{' '}
            <button
              onClick={() => navigate('/signin')}
              className="text-violet-600 hover:underline font-medium"
            >
              Sign in with a different account
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
