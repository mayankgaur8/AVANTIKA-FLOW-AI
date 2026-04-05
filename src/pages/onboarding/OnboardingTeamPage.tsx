import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { useAuth } from '../../context/AuthContext';
import type { AuthUser } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { authStore } from '../../lib/auth';

export const OnboardingTeamPage = () => {
  const navigate = useNavigate();
  const { user, token: authToken, setSession } = useAuth();
  // Fall back to localStorage in case AuthContext token state hasn't propagated yet
  const token = authToken ?? authStore.getToken();
  const [teamName, setTeamName] = useState(user?.team_name ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If team already created (e.g. page refresh mid-flow), skip ahead to step 2
  useEffect(() => {
    if (user?.workspace_id) {
      navigate('/onboarding/invite', { replace: true });
    }
  }, [user?.workspace_id, navigate]);

  const canSubmit = teamName.trim().length >= 2 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!token) {
      setError('Session expired. Please sign in again.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const result = await api.onboardingTeam(token, teamName.trim()) as { user?: AuthUser };
      // Directly update AuthContext with the returned user so workspace_id is
      // immediately visible — avoids the guard race on the next page
      if (result?.user) {
        setSession(token, result.user);
      }
      navigate('/onboarding/invite');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout step={1} totalSteps={3}>
      {/* Icon */}
      <div className="flex justify-center mb-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #ede9fe, #dbeafe)' }}
        >
          <Building2 size={26} className="text-violet-600" />
        </div>
      </div>

      {/* Headline */}
      <h1 className="text-2xl font-black text-gray-900 text-center mb-2 leading-tight">
        Name your workspace
      </h1>
      <p className="text-gray-500 text-sm text-center mb-8">
        This is how your team will see your workspace. You can always change it later.
      </p>

      {/* Input */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Workspace name
        </label>
        <input
          type="text"
          autoFocus
          placeholder="e.g. Acme Operations"
          value={teamName}
          onChange={(e) => { setTeamName(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-full px-4 py-3.5 rounded-xl border-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150"
          style={{
            borderColor: error ? '#ef4444' : teamName.trim().length >= 2 ? '#8b5cf6' : '#e5e7eb',
            boxShadow: error
              ? '0 0 0 3px rgba(239,68,68,0.1)'
              : teamName.trim().length >= 2
              ? '0 0 0 3px rgba(139,92,246,0.1)'
              : 'none',
          }}
        />
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 mt-1.5 font-medium"
          >
            {error}
          </motion.p>
        )}
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['My Team', 'Operations', 'Engineering', 'Sales Team'].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setTeamName(suggestion)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={{
              borderColor: teamName === suggestion ? '#8b5cf6' : '#e5e7eb',
              background: teamName === suggestion ? '#f5f3ff' : 'white',
              color: teamName === suggestion ? '#7c3aed' : '#6b7280',
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* CTA */}
      <motion.button
        onClick={handleSubmit}
        disabled={!canSubmit}
        whileHover={canSubmit ? { scale: 1.02 } : {}}
        whileTap={canSubmit ? { scale: 0.98 } : {}}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-all"
        style={{
          background: canSubmit
            ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
            : '#e5e7eb',
          color: canSubmit ? 'white' : '#9ca3af',
          boxShadow: canSubmit ? '0 4px 18px rgba(99,102,241,0.35)' : 'none',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? (
          <><Loader2 size={15} className="animate-spin" /> Creating workspace…</>
        ) : (
          <>Get Started <ArrowRight size={15} strokeWidth={2.5} /></>
        )}
      </motion.button>

      {/* Already have a team note */}
      <p className="text-center text-xs text-gray-400 mt-5">
        Already have a workspace?{' '}
        <button
          className="text-violet-600 hover:underline font-medium"
          onClick={() => navigate('/dashboard')}
        >
          Go to dashboard
        </button>
      </p>
    </OnboardingLayout>
  );
};
