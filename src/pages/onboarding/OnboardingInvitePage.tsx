import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, X, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { authStore } from '../../lib/auth';

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const OnboardingInvitePage = () => {
  const navigate = useNavigate();
  const { user, token: authToken } = useAuth();
  const token = authToken ?? authStore.getToken();

  // Guard: must have completed step 1 first
  useEffect(() => {
    if (!user?.workspace_id) {
      navigate('/onboarding/team', { replace: true });
    }
  }, [user?.workspace_id, navigate]);

  const [emails, setEmails] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const validEmails = emails.filter(isValidEmail);
  const hasAnyValid = validEmails.length > 0;

  const updateEmail = (index: number, value: string) => {
    setEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
    setError('');
  };

  const addField = () => {
    if (emails.length < 8) setEmails((prev) => [...prev, '']);
  };

  const removeField = (index: number) => {
    if (emails.length <= 1) return;
    setEmails((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!hasAnyValid || loading || !token) return;
    setLoading(true);
    setError('');

    try {
      await api.onboardingInvite(token, validEmails);
      setSent(true);
      setTimeout(() => navigate('/onboarding/intro'), 1400);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send invites. You can skip and try later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => navigate('/onboarding/intro');

  if (sent) {
    return (
      <OnboardingLayout step={2} totalSteps={3}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-10 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 18 }}
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}
          >
            <CheckCircle2 size={30} className="text-emerald-600" />
          </motion.div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Invites sent!</h3>
          <p className="text-gray-500 text-sm">
            Your teammates will receive an invite shortly.
          </p>
        </motion.div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout step={2} totalSteps={3}>
      {/* Icon */}
      <div className="flex justify-center mb-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #dbeafe, #ede9fe)' }}
        >
          <Users size={26} className="text-blue-600" />
        </div>
      </div>

      {/* Headline */}
      <h1 className="text-2xl font-black text-gray-900 text-center mb-2 leading-tight">
        Invite your teammates
      </h1>
      <p className="text-gray-500 text-sm text-center mb-8">
        Collaborate from day one. Teammates get a link to join your workspace.
      </p>

      {/* Email inputs */}
      <div className="space-y-3 mb-4">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Email addresses
        </label>

        <AnimatePresence initial={false}>
          {emails.map((email, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="flex items-center gap-2"
            >
              <input
                type="email"
                placeholder={`teammate${index + 1}@company.com`}
                value={email}
                onChange={(e) => updateEmail(index, e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150"
                style={{
                  borderColor: isValidEmail(email) ? '#8b5cf6' : '#e5e7eb',
                  boxShadow: isValidEmail(email) ? '0 0 0 3px rgba(139,92,246,0.08)' : 'none',
                }}
              />
              {emails.length > 1 && (
                <button
                  onClick={() => removeField(index)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                  style={{ color: '#9ca3af', background: '#f9fafb', border: '1px solid #e5e7eb' }}
                  aria-label="Remove"
                >
                  <X size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add field */}
        {emails.length < 8 && (
          <button
            onClick={addField}
            className="flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors mt-2"
          >
            <Plus size={15} strokeWidth={2.5} /> Add another
          </button>
        )}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500 font-medium mb-4"
        >
          {error}
        </motion.p>
      )}

      {/* Valid count badge */}
      {hasAnyValid && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-medium mb-4"
          style={{ color: '#7c3aed' }}
        >
          {validEmails.length} invite{validEmails.length > 1 ? 's' : ''} ready to send
        </motion.p>
      )}

      {/* Send button */}
      <motion.button
        onClick={handleSend}
        disabled={!hasAnyValid || loading}
        whileHover={hasAnyValid && !loading ? { scale: 1.02 } : {}}
        whileTap={hasAnyValid && !loading ? { scale: 0.98 } : {}}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-all mb-3"
        style={{
          background: hasAnyValid ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#e5e7eb',
          color: hasAnyValid ? 'white' : '#9ca3af',
          boxShadow: hasAnyValid ? '0 4px 18px rgba(99,102,241,0.35)' : 'none',
          cursor: hasAnyValid && !loading ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? (
          <><Loader2 size={15} className="animate-spin" /> Sending invites…</>
        ) : (
          <>Send Invites <ArrowRight size={15} strokeWidth={2.5} /></>
        )}
      </motion.button>

      {/* Skip */}
      <button
        onClick={handleSkip}
        className="w-full py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Skip for now — I'll invite people later
      </button>
    </OnboardingLayout>
  );
};
