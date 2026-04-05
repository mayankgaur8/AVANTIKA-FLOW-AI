import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, MousePointerClick, Camera, Share2, ArrowRight, Loader2 } from 'lucide-react';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { authStore } from '../../lib/auth';
import { consumePostAuthRedirect } from '../../lib/postAuthRedirect';

const HOW_STEPS = [
  { icon: MousePointerClick, label: 'Click record', desc: 'Start capturing from your browser toolbar.' },
  { icon: Camera,            label: 'Do your thing', desc: 'Go through any workflow — Avantika captures each step.' },
  { icon: Share2,            label: 'Share instantly', desc: 'A polished guide is ready to share in seconds.' },
];

export const OnboardingIntroPage = () => {
  const navigate = useNavigate();
  const { user, token: authToken, setSession } = useAuth();
  const token = authToken ?? authStore.getToken();
  const [completing, setCompleting] = useState(false);

  const complete = async () => {
    setCompleting(true);
    try {
      if (token) {
        await api.onboardingComplete(token);
        // Mark user as onboarded directly — no extra api.me() round-trip
        if (user) {
          setSession(token, { ...user, is_onboarded: true });
        }
      }
    } catch {
      // Non-fatal: still navigate forward
    } finally {
      setCompleting(false);
    }
    navigate(consumePostAuthRedirect() || '/dashboard', { replace: true });
  };

  return (
    <OnboardingLayout step={3} totalSteps={3}>
      {/* Icon */}
      <div className="flex justify-center mb-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #fdf4ff, #ede9fe)' }}
        >
          <Zap size={26} className="text-violet-600" />
        </div>
      </div>

      {/* Headline */}
      <h1 className="text-2xl font-black text-gray-900 text-center mb-2 leading-tight">
        You're ready to go!
      </h1>
      <p className="text-gray-500 text-sm text-center mb-8">
        Install the Avantika Flow AI extension to capture workflows in any browser tab — automatically.
      </p>

      {/* How it works mini-steps */}
      <div className="rounded-2xl mb-7 overflow-hidden" style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}>
        {HOW_STEPS.map(({ icon: Icon, label, desc }, i) => (
          <div
            key={label}
            className="flex items-start gap-4 px-5 py-4"
            style={{ borderBottom: i < HOW_STEPS.length - 1 ? '1px solid #e5e7eb' : 'none' }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'linear-gradient(135deg, #ede9fe, #dbeafe)' }}
            >
              <Icon size={15} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
            <span
              className="ml-auto text-xs font-black text-gray-300 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            >
              {i + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Install CTA */}
      <motion.a
        href="https://chrome.google.com/webstore"
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-white font-bold text-sm mb-3"
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          boxShadow: '0 4px 18px rgba(99,102,241,0.35)',
        }}
        onClick={() => { complete(); }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
        </svg>
        Install Chrome Extension
      </motion.a>

      {/* Skip / go to dashboard */}
      <button
        onClick={() => complete()}
        disabled={completing}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
      >
        {completing ? (
          <><Loader2 size={14} className="animate-spin" /> Taking you to dashboard…</>
        ) : (
          <>Skip for now — go to dashboard <ArrowRight size={14} /></>
        )}
      </button>

      {/* Trust note */}
      <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
        The extension only activates when you click Record.{' '}
        <span className="font-medium text-gray-500">No background tracking.</span>
      </p>
    </OnboardingLayout>
  );
};
