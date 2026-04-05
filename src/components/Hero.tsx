import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TrustBadge } from './TrustBadge';
import { UseCaseCards } from './UseCaseCards';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api } from '../lib/api';
import { setSopBuilderHandoff } from '../lib/sopHandoff';

interface HeroProps {
  onTakeTour?: () => void;
  onRequestDemo?: () => void;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

export const Hero = ({ onTakeTour, onRequestDemo }: HeroProps) => {
  const navigate = useNavigate();
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
  const [recommendedIntentId, setRecommendedIntentId] = useState<string | null>(null);
  const [prefillByIntent, setPrefillByIntent] = useState<Record<string, Record<string, string>>>({});
  const [instantTemplates, setInstantTemplates] = useState<Array<{ intentId: string; template: string }>>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [customIntentText, setCustomIntentText] = useState('');
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState('');
  const { user, token: authToken } = useAuth();
  const token = authToken ?? authStore.getToken();

  const roleContext = useMemo(() => {
    const candidate = (user as { role?: string; selected_team?: string; selected_persona?: string } | null);
    return candidate?.role || candidate?.selected_team || candidate?.selected_persona || '';
  }, [user]);

  useEffect(() => {
    const anonIdKey = 'avantika:launcher:anon-user';
    let anonUserId = localStorage.getItem(anonIdKey);
    if (!anonUserId) {
      anonUserId = `anon-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(anonIdKey, anonUserId);
    }

    api.homeSelectorBootstrap({ role: roleContext, userId: anonUserId }, token || undefined)
      .then((res) => {
        setRecommendedIntentId(res.recommendedIntentId || null);
        setPrefillByIntent(res.prefillByIntent || {});
        setInstantTemplates(res.instantTemplates || []);
        setSelectedUseCase((prev) => prev || res.recommendedIntentId || 'create-sops');

        const initial: Record<string, string> = {};
        Object.entries(res.prefillByIntent || {}).forEach(([intentId, values]) => {
          Object.entries(values || {}).forEach(([k, v]) => {
            initial[`${intentId}:${k}`] = String(v || '');
          });
        });
        setFormValues(initial);
      })
      .catch(() => {
        setSelectedUseCase((prev) => prev || 'create-sops');
      });
  }, [roleContext, token]);

  const setField = (intentId: string, field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [`${intentId}:${field}`]: value }));
  };

  const getField = (intentId: string, field: string) => formValues[`${intentId}:${field}`] || '';

  const launchWorkflow = async () => {
    if (!selectedUseCase) return;
    setLaunching(true);
    setLaunchError('');
    try {
      const anonId = localStorage.getItem('avantika:launcher:anon-user') || `anon-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('avantika:launcher:anon-user', anonId);

      const payloadByIntent: Record<string, Record<string, string>> = {
        'onboard-new-hires': {
          role: getField('onboard-new-hires', 'role'),
          tools: getField('onboard-new-hires', 'tools'),
          teamSize: getField('onboard-new-hires', 'teamSize'),
        },
        'create-sops': {
          processName: getField('create-sops', 'processName'),
          inputMode: getField('create-sops', 'inputMode') || 'ai-generated',
        },
        'build-training-docs': {
          topic: getField('build-training-docs', 'topic'),
          tool: getField('build-training-docs', 'tool'),
        },
        'implement-software': {
          toolName: getField('implement-software', 'toolName'),
          rolloutScope: getField('implement-software', 'rolloutScope'),
        },
        'assist-customers': {
          supportType: getField('assist-customers', 'supportType'),
          channel: getField('assist-customers', 'channel'),
        },
        'something-else': {
          customGoal: customIntentText,
        },
      };

      const selectedPayload = payloadByIntent[selectedUseCase] || {};

      api.homeSelectorSelect({
        userId: (user as { id?: string } | null)?.id || anonId,
        selectedIntent: selectedUseCase,
        context: selectedPayload,
      }, token || undefined).catch(() => {
        // Selection tracking is non-blocking for launcher UX.
      });

      const generated = selectedUseCase === 'something-else'
        ? await api.homeSelectorSuggest(customIntentText || 'Help my team build a custom workflow system')
        : await api.homeSelectorGenerate(selectedUseCase, selectedPayload);

      setSopBuilderHandoff({
        title: generated.title,
        description: generated.description,
        sourceMethod: selectedUseCase === 'something-else' ? 'ai-text' : 'template',
        steps: generated.steps,
        aiInsights: generated.aiInsights,
      });

      navigate('/workflow-ai/sop-builder');
    } catch (e) {
      setLaunchError(e instanceof Error ? e.message : 'Unable to launch workflow');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <section
      id="tour-hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 md:px-8 pt-16 pb-20"
      style={{ zIndex: 1 }}
      aria-label="Hero section"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center text-center w-full max-w-5xl mx-auto"
      >
        {/* Trust badge */}
        <motion.div variants={itemVariants} className="mb-8">
          <TrustBadge />
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-[76px] font-black leading-[1.06] tracking-tight mb-6"
        >
          <span className="text-white">Turn your workflows into </span>
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 45%, #f472b6 100%)',
            }}
          >
            scalable systems
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
          style={{ color: 'rgba(255,255,255,0.62)' }}
        >
          Capture, standardize, and optimize every process with AI-driven automation — so your teams work faster, smarter, and without errors.
        </motion.p>

        {/* Question prompt */}
        <motion.p
          variants={itemVariants}
          className="text-base font-semibold mb-5"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          How will your team use{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #60a5fa, #a78bfa)' }}
          >
            Avantika Flow AI
          </span>
          ?
        </motion.p>

        {/* Use-case selector cards */}
        <motion.div variants={itemVariants} className="w-full mb-10">
          <UseCaseCards onSelect={setSelectedUseCase} selectedId={selectedUseCase} recommendedId={recommendedIntentId} />

          {selectedUseCase ? (
            <div
              className="mt-5 w-full rounded-2xl p-4 text-left"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">AI Guided Setup</p>

              {selectedUseCase === 'onboard-new-hires' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input value={getField('onboard-new-hires', 'role')} onChange={(e) => setField('onboard-new-hires', 'role', e.target.value)} placeholder="Role" className="rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                  <input value={getField('onboard-new-hires', 'tools')} onChange={(e) => setField('onboard-new-hires', 'tools', e.target.value)} placeholder="Tools" className="rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                  <input value={getField('onboard-new-hires', 'teamSize')} onChange={(e) => setField('onboard-new-hires', 'teamSize', e.target.value)} placeholder="Team size" className="rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                </div>
              ) : null}

              {selectedUseCase === 'create-sops' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input value={getField('create-sops', 'processName')} onChange={(e) => setField('create-sops', 'processName', e.target.value)} placeholder="Process name" className="rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                  <input value={getField('create-sops', 'inputMode')} onChange={(e) => setField('create-sops', 'inputMode', e.target.value)} placeholder="Input mode: manual or ai-generated" className="rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                </div>
              ) : null}

              {selectedUseCase === 'build-training-docs' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input value={getField('build-training-docs', 'topic')} onChange={(e) => setField('build-training-docs', 'topic', e.target.value)} placeholder="Topic" className="rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                  <input value={getField('build-training-docs', 'tool')} onChange={(e) => setField('build-training-docs', 'tool', e.target.value)} placeholder="Tool" className="rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                </div>
              ) : null}

              {selectedUseCase === 'implement-software' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input value={getField('implement-software', 'toolName')} onChange={(e) => setField('implement-software', 'toolName', e.target.value)} placeholder="Tool name (Jira, SAP, CRM)" className="rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                  <input value={getField('implement-software', 'rolloutScope')} onChange={(e) => setField('implement-software', 'rolloutScope', e.target.value)} placeholder="Rollout scope" className="rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                </div>
              ) : null}

              {selectedUseCase === 'assist-customers' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input value={getField('assist-customers', 'supportType')} onChange={(e) => setField('assist-customers', 'supportType', e.target.value)} placeholder="Support type" className="rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                  <input value={getField('assist-customers', 'channel')} onChange={(e) => setField('assist-customers', 'channel', e.target.value)} placeholder="Channel (chat/email/helpdesk)" className="rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
                </div>
              ) : null}

              {selectedUseCase === 'something-else' ? (
                <textarea value={customIntentText} onChange={(e) => setCustomIntentText(e.target.value)} rows={3} placeholder="Describe what your team wants to achieve" className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-none" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {instantTemplates.filter((tpl) => tpl.intentId === selectedUseCase).map((tpl) => (
                  <span key={tpl.template} className="text-[11px] px-2 py-1 rounded-full text-emerald-300" style={{ background: 'rgba(16,185,129,0.15)' }}>
                    Suggested template: {tpl.template}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={launchWorkflow}
                  disabled={launching}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                >
                  {launching ? 'Launching...' : 'Launch AI Workflow'}
                  <ArrowRight size={14} />
                </button>
              </div>

              {launchError ? <p className="text-xs text-red-300 mt-2">{launchError}</p> : null}
            </div>
          ) : null}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Primary: Get Started */}
          <motion.button
            onClick={() => {
              if (selectedUseCase) {
                launchWorkflow();
                return;
              }
              navigate('/workflow-ai/sop-builder');
            }}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white font-bold text-base select-none w-full sm:w-auto"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 55%, #ec4899 100%)',
              boxShadow: '0 4px 30px rgba(139,92,246,0.45), 0 2px 10px rgba(0,0,0,0.3)',
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 8px 42px rgba(139,92,246,0.65), 0 4px 16px rgba(0,0,0,0.35)',
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          >
            Get Started Free
            <motion.span
              className="inline-flex"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowRight size={16} strokeWidth={2.5} />
            </motion.span>
          </motion.button>

          {/* Secondary: Take a Tour */}
          <motion.button
            onClick={onTakeTour}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-full text-white font-semibold text-sm select-none w-full sm:w-auto"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.16)',
              backdropFilter: 'blur(12px)',
            }}
            whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.12)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <Sparkles size={11} className="text-white" />
            </div>
            Take a Tour
          </motion.button>

          {/* Tertiary: Request Demo */}
          <motion.button
            onClick={onRequestDemo}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-full text-white font-semibold text-sm select-none w-full sm:w-auto"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(12px)',
            }}
            whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          >
            <CalendarDays size={14} className="text-white/60" />
            Request a Demo
          </motion.button>
        </motion.div>

        {/* Product browser mockup */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-4xl mt-16 mb-4"
          style={{ filter: 'drop-shadow(0 32px 80px rgba(96,165,250,0.18)) drop-shadow(0 16px 40px rgba(0,0,0,0.6))' }}
        >
          <div
            className="rounded-2xl overflow-hidden w-full"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {/* Browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
            >
              <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
              <div
                className="flex-1 mx-3 h-6 rounded-lg flex items-center px-3"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  app.avantikaflow.ai/guides
                </span>
              </div>
            </div>

            {/* App shell preview */}
            <div className="flex h-64 sm:h-80">
              {/* Sidebar */}
              <div
                className="hidden sm:flex flex-col w-48 flex-shrink-0 p-3 gap-1"
                style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}
              >
                {['📋 My Guides', '⭐ Favorites', '🕐 Recent', '👥 Team', '📁 Templates'].map((item, i) => (
                  <div
                    key={item}
                    className="px-3 py-2 rounded-lg text-xs font-medium"
                    style={{
                      background: i === 0 ? 'rgba(96,165,250,0.15)' : 'transparent',
                      color: i === 0 ? '#93c5fd' : 'rgba(255,255,255,0.38)',
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>

              {/* Content area */}
              <div className="flex-1 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-white/80">My Guides</span>
                  <div
                    className="px-3 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white' }}
                  >
                    + New Guide
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { title: 'CRM Onboarding', steps: 12, color: '#60a5fa' },
                    { title: 'Invoice Approval', steps: 7, color: '#a78bfa' },
                    { title: 'IT Provisioning', steps: 9, color: '#f472b6' },
                    { title: 'Sales Playbook', steps: 15, color: '#34d399' },
                    { title: 'Support Workflow', steps: 6, color: '#fb923c' },
                    { title: 'Q4 Operations', steps: 22, color: '#38bdf8' },
                  ].map(({ title, steps, color }) => (
                    <div
                      key={title}
                      className="p-3 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <div className="w-6 h-6 rounded-lg mb-2" style={{ background: `${color}25`, border: `1px solid ${color}40` }} />
                      <p className="text-xs font-semibold text-white/80 leading-tight mb-1">{title}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{steps} steps</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Social proof strip */}
        <motion.div
          variants={itemVariants}
          className="mt-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-8"
        >
          {[
            { value: '5M+', label: 'Users worldwide' },
            { value: '10k+', label: 'Teams onboarded' },
            { value: '50M+', label: 'Docs created' },
            { value: '98%', label: 'Customer satisfaction' },
          ].map(({ value, label }) => (
            <div key={value} className="flex flex-col items-center">
              <span
                className="text-2xl font-black bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #60a5fa, #a78bfa)' }}
              >
                {value}
              </span>
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {label}
              </span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        aria-hidden="true"
      >
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Scroll to explore</span>
        <motion.div
          className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
          style={{ border: '1.5px solid rgba(255,255,255,0.2)' }}
        >
          <motion.div
            className="w-1 h-2 rounded-full bg-white/40"
            animate={{ y: [0, 8, 0], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};
