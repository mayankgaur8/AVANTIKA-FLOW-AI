import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Briefcase, User, FileText, GraduationCap, Users,
  Laugh, Sparkles, Code, ArrowRight, ChevronLeft, CheckCircle2,
  Loader2, Mail,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../BrandLogo';
import { api } from '../../lib/api';
import { authStore } from '../../lib/auth';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TOTAL = 4;

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 72 : -72, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
  exit: (dir: number) => ({ x: dir > 0 ? -72 : 72, opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } }),
};

// ─── Progress bar ─────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ step: number }> = ({ step }) => (
  <div className="flex items-center gap-2 mb-6">
    {Array.from({ length: TOTAL }).map((_, i) => (
      <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: i < step ? '100%' : '0%' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ background: i < step ? 'linear-gradient(90deg, #3b82f6, #8b5cf6)' : 'transparent' }}
        />
      </div>
    ))}
  </div>
);

// ─── STEP 1 — Personalization ─────────────────────────────────────────────────

const PERSONA_CARDS = [
  {
    id: 'work',
    icon: Briefcase,
    label: 'Work',
    description: 'Document team processes and collaborate with colleagues',
    gradient: 'from-blue-500 to-blue-600',
    glow: 'rgba(59,130,246,0.25)',
  },
  {
    id: 'personal',
    icon: User,
    label: 'Personal',
    description: 'Capture your own workflows, guides, and SOPs',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'rgba(139,92,246,0.25)',
  },
];

const Step1: React.FC = () => {
  const { data, updateData, nextStep } = useOnboarding();

  const select = (id: string) => {
    updateData({ userType: id });
    setTimeout(nextStep, 220);
  };

  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">
        Let's personalize your experience!
      </h2>
      <p className="text-gray-500 text-sm mb-8">What brings you here today?</p>

      <div className="grid grid-cols-2 gap-4">
        {PERSONA_CARDS.map(({ id, icon: Icon, label, description, gradient, glow }) => {
          const selected = data.userType === id;
          return (
            <motion.button
              key={id}
              onClick={() => select(id)}
              whileHover={{ y: -3, boxShadow: `0 12px 32px ${glow}` }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 18 }}
              className="relative flex flex-col items-start p-5 rounded-2xl border-2 text-left cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              style={{
                borderColor: selected ? '#8b5cf6' : 'rgba(0,0,0,0.08)',
                background: selected ? 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(139,92,246,0.07))' : 'white',
                boxShadow: selected ? `0 8px 24px ${glow}` : '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3"
                >
                  <CheckCircle2 size={16} className="text-violet-500" />
                </motion.div>
              )}
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}
                style={{ boxShadow: `0 4px 14px ${glow}` }}
              >
                <Icon size={18} className="text-white" strokeWidth={2} />
              </div>
              <p className="font-bold text-gray-900 text-base mb-1">{label}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// ─── STEP 2 — Use Case ────────────────────────────────────────────────────────

const USE_CASES = [
  { id: 'documentation', icon: FileText, label: 'Documentation', color: '#3b82f6' },
  { id: 'education', icon: GraduationCap, label: 'Education', color: '#8b5cf6' },
  { id: 'freelance', icon: Briefcase, label: 'Freelance', color: '#ec4899' },
  { id: 'collaboration', icon: Users, label: 'Working with Others', color: '#10b981' },
  { id: 'fun', icon: Laugh, label: 'Just for Fun', color: '#f59e0b' },
  { id: 'other', icon: Sparkles, label: 'Something Else', color: '#6366f1' },
  { id: 'engineering', icon: Code, label: 'Engineering', color: '#0ea5e9' },
];

const Step2: React.FC = () => {
  const { data, updateData, nextStep, prevStep } = useOnboarding();

  const toggle = (id: string) => {
    const current = data.useCases;
    updateData({
      useCases: current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
    });
  };

  const canContinue = data.useCases.length > 0;

  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">
        How do you plan to use Avantika Flow AI?
      </h2>
      <p className="text-gray-500 text-sm mb-6">Select all that apply</p>

      <div className="grid grid-cols-2 gap-2.5 mb-7">
        {USE_CASES.map(({ id, icon: Icon, label, color }) => {
          const selected = data.useCases.includes(id);
          return (
            <motion.button
              key={id}
              onClick={() => toggle(id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
              style={{
                borderColor: selected ? color : 'rgba(0,0,0,0.08)',
                background: selected ? `${color}10` : 'white',
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150"
                style={{ background: selected ? color : `${color}18` }}
              >
                <Icon size={14} style={{ color: selected ? 'white' : color }} strokeWidth={2} />
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: selected ? '#111827' : '#6b7280' }}
              >
                {label}
              </span>
              {selected && <CheckCircle2 size={14} className="ml-auto flex-shrink-0" style={{ color }} />}
            </motion.button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={prevStep}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={15} /> Back
        </button>
        <motion.button
          onClick={nextStep}
          disabled={!canContinue}
          whileHover={canContinue ? { scale: 1.02 } : {}}
          whileTap={canContinue ? { scale: 0.98 } : {}}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all"
          style={{
            background: canContinue ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#e5e7eb',
            color: canContinue ? 'white' : '#9ca3af',
            boxShadow: canContinue ? '0 4px 16px rgba(99,102,241,0.35)' : 'none',
            cursor: canContinue ? 'pointer' : 'not-allowed',
          }}
        >
          Continue <ArrowRight size={14} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
};

// ─── STEP 3 — Team ────────────────────────────────────────────────────────────

const TEAMS = [
  'Accounting & Finance',
  'Consulting & Client Services',
  'Customer Support',
  'Engineering / Product / Design',
  'HR',
  'L&D',
  'IT',
  'Marketing',
  'Operations',
  'Project Management',
  'Sales',
  'Other',
];

const Step3: React.FC = () => {
  const { data, updateData, nextStep, prevStep } = useOnboarding();
  const canContinue = data.team.length > 0;

  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">
        Tell us about your team
      </h2>
      <p className="text-gray-500 text-sm mb-7">Which department best describes you?</p>

      <div className="mb-7">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Department <span className="text-red-400">*</span>
        </label>
        <select
          value={data.team}
          onChange={(e) => updateData({ team: e.target.value })}
          className="w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium bg-white transition-all duration-150 focus:outline-none appearance-none cursor-pointer"
          style={{
            borderColor: data.team ? '#8b5cf6' : 'rgba(0,0,0,0.1)',
            color: data.team ? '#111827' : '#9ca3af',
            boxShadow: data.team ? '0 0 0 3px rgba(139,92,246,0.12)' : 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 16px center',
            paddingRight: '40px',
          }}
        >
          <option value="" disabled>Select your department</option>
          {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="flex gap-3">
        <button
          onClick={prevStep}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={15} /> Back
        </button>
        <motion.button
          onClick={nextStep}
          disabled={!canContinue}
          whileHover={canContinue ? { scale: 1.02 } : {}}
          whileTap={canContinue ? { scale: 0.98 } : {}}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
          style={{
            background: canContinue ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#e5e7eb',
            color: canContinue ? 'white' : '#9ca3af',
            boxShadow: canContinue ? '0 4px 16px rgba(99,102,241,0.35)' : 'none',
            cursor: canContinue ? 'pointer' : 'not-allowed',
          }}
        >
          Continue <ArrowRight size={14} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
};

// ─── STEP 4 — Account Creation ────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Step4: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData, prevStep, closeOnboarding, resetFlow } = useOnboarding();
  const { refresh } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const canSubmit = isValidEmail(data.email) && !isLoading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    setError('');

    try {
      await api.onboarding({
        userType: data.userType,
        useCases: data.useCases,
        team: data.team,
        email: data.email,
        source_page: data.sourcePage,
        cta_clicked: data.ctaClicked,
        campaign_source: data.campaignSource,
        onboarding_step_data: {
          step: 4,
          has_use_cases: data.useCases.length > 0,
        },
      });

      const signup = await api.signup({
        email: data.email,
        source_page: data.sourcePage,
        cta_clicked: data.ctaClicked,
        campaign_source: data.campaignSource,
        selected_use_case: data.useCases[0] || undefined,
        selected_team: data.team || undefined,
        selected_persona: data.userType || undefined,
      });

      authStore.save(signup.token, signup.user);
      await refresh();

      setIsSuccess(true);
      resetFlow();
      const user = signup.user as { email_verified?: boolean; is_onboarded?: boolean };
      const nextRoute = !user.email_verified
        ? '/verify-email-pending'
        : user.is_onboarded === false
        ? '/onboarding/team'
        : '/dashboard';

      setTimeout(() => {
        closeOnboarding();
        setIsSuccess(false);
        navigate(nextRoute);
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    const params = new URLSearchParams({
      source_page: data.sourcePage,
      cta_clicked: data.ctaClicked || 'onboarding_google_signup',
      campaign_source: data.campaignSource || '',
      selected_use_case: data.useCases[0] || '',
      selected_team: data.team || '',
      selected_persona: data.userType || '',
    });

    window.location.href = `/api/auth/google?${params.toString()}`;
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 18 }}
          className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
        >
          <CheckCircle2 size={30} className="text-white" />
        </motion.div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">You're all set!</h3>
        <p className="text-gray-500 text-sm">Taking you to your workspace…</p>
      </motion.div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900 mb-1.5 leading-tight">
        Create your free account
      </h2>
      <p className="text-gray-500 text-sm mb-7">
        Start documenting in seconds.{' '}
        <span className="font-semibold text-gray-700">No credit card required.</span>
      </p>

      {/* Google button */}
      <motion.button
        whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-800 mb-5 transition-all"
        onClick={handleGoogleSignup}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
        {isGoogleLoading ? 'Redirecting to Google...' : 'Sign up with Google'}
      </motion.button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400 font-medium">or continue with email</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Email input */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Work Email
        </label>
        <input
          ref={emailRef}
          type="email"
          placeholder="you@company.com"
          value={data.email}
          onChange={(e) => {
            updateData({ email: e.target.value });
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-full px-4 py-3.5 rounded-xl border-2 text-sm transition-all duration-150 focus:outline-none"
          style={{
            borderColor: error ? '#ef4444' : data.email && isValidEmail(data.email) ? '#8b5cf6' : 'rgba(0,0,0,0.1)',
            boxShadow: error
              ? '0 0 0 3px rgba(239,68,68,0.12)'
              : data.email && isValidEmail(data.email)
              ? '0 0 0 3px rgba(139,92,246,0.12)'
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

      {/* Submit */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={prevStep}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={15} /> Back
        </button>
        <motion.button
          onClick={handleSubmit}
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.02 } : {}}
          whileTap={canSubmit ? { scale: 0.98 } : {}}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
          style={{
            background: canSubmit ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#e5e7eb',
            color: canSubmit ? 'white' : '#9ca3af',
            boxShadow: canSubmit ? '0 4px 16px rgba(99,102,241,0.35)' : 'none',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {isLoading ? (
            <><Loader2 size={15} className="animate-spin" /> Creating account…</>
          ) : (
            <><Mail size={14} /> Continue with email</>
          )}
        </motion.button>
      </div>

      {/* Terms */}
      <p className="text-center text-xs text-gray-400 leading-relaxed">
        By signing up, you agree to our{' '}
        <a href="#" className="text-blue-600 hover:underline font-medium" onClick={(e) => e.preventDefault()}>Terms of Service</a>
        {' '}and{' '}
        <a href="#" className="text-blue-600 hover:underline font-medium" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
      </p>
    </div>
  );
};

// ─── STEP LABELS ──────────────────────────────────────────────────────────────

const STEP_META = [
  { label: 'About you' },
  { label: 'Use case' },
  { label: 'Your team' },
  { label: 'Account' },
];

// ─── MAIN MODAL ───────────────────────────────────────────────────────────────

export const OnboardingModal: React.FC = () => {
  const { isOpen, step, closeOnboarding } = useOnboarding();
  const [prevStep, setPrevStep] = useState(step);
  const direction = step >= prevStep ? 1 : -1;

  // Track direction for animation
  if (step !== prevStep) setPrevStep(step);

  const stepComponents = [Step1, Step2, Step3, Step4];
  const StepComponent = stepComponents[step - 1];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 flex items-center justify-center px-4"
            style={{ zIndex: 100, background: 'rgba(5,12,24,0.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) closeOnboarding(); }}
          >
            {/* Modal panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[520px] bg-white rounded-3xl overflow-hidden"
              style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.3), 0 12px 30px rgba(0,0,0,0.15)' }}
            >
              {/* Gradient top bar */}
              <div
                className="h-1 w-full"
                style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)' }}
              />

              <div className="p-7">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <BrandLogo
                    imageClassName="h-9 w-9 object-cover object-top rounded-lg ring-1 ring-gray-200 shadow-[0_0_14px_rgba(59,130,246,0.22)]"
                    wordmarkClassName="font-bold text-sm text-gray-800 tracking-tight"
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-medium">{STEP_META[step - 1].label}</span>
                    <button
                      onClick={closeOnboarding}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                      aria-label="Close"
                    >
                      <X size={15} className="text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <ProgressBar step={step} />

                {/* Step label row */}
                <div className="flex items-center gap-2 mb-6">
                  {STEP_META.map((meta, i) => (
                    <React.Fragment key={meta.label}>
                      <span
                        className="text-xs font-semibold transition-colors duration-200"
                        style={{ color: i + 1 === step ? '#8b5cf6' : i + 1 < step ? '#10b981' : '#d1d5db' }}
                      >
                        {i + 1 < step ? '✓' : `${i + 1}.`} {meta.label}
                      </span>
                      {i < STEP_META.length - 1 && <span className="text-gray-200 text-xs">→</span>}
                    </React.Fragment>
                  ))}
                </div>

                {/* Animated step content */}
                <div className="overflow-hidden" style={{ minHeight: '320px' }}>
                  <AnimatePresence custom={direction} mode="wait">
                    <motion.div
                      key={step}
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                    >
                      <StepComponent />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
