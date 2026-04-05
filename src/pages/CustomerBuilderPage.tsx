import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles, ArrowLeft, Loader2, CheckCircle2, GripVertical,
  Trash2, Plus, ChevronDown, ChevronUp, Rocket, ExternalLink,
  Brain, Lightbulb, Pencil, PlayCircle, Users,
  type LucideIcon,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type CustomerBuilderType, type CustomerStep } from '../lib/api';
import { setPostAuthRedirect } from '../lib/postAuthRedirect';

export type CustomerInputVariant = 'onboarding-template' | 'support-issue' | 'demo-type' | 'sales-process';

export interface CustomerBuilderConfig {
  customerType: CustomerBuilderType;
  inputVariant: CustomerInputVariant;
  label: string;
  tagline: string;
  accent: string;
  secondaryAccent: string;
  icon: LucideIcon;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  aiInsights: string[];
  generateLabel: string;
  saveLabel: string;
}

type BuilderStage = 'input' | 'generating' | 'review';

type EditableStep = CustomerStep & { _id: string; expanded: boolean };

const ONBOARDING_TEMPLATES = [
  { key: 'saas', label: 'SaaS Onboarding', icon: '🚀', desc: 'Standard product onboarding for new users' },
  { key: 'enterprise', label: 'Enterprise Onboarding', icon: '🏢', desc: 'Multi-stakeholder onboarding at scale' },
  { key: 'product', label: 'Product-specific Onboarding', icon: '🧩', desc: 'Feature and role-based onboarding journeys' },
];

const SUPPORT_ISSUE_TYPES = [
  { key: 'technical', label: 'Technical Issue', icon: '🛠️', desc: 'Bugs, outages, errors, and integrations' },
  { key: 'billing', label: 'Billing Issue', icon: '💳', desc: 'Invoices, charges, refunds, and plan questions' },
  { key: 'general', label: 'General Support', icon: '💬', desc: 'Product usage and guidance requests' },
];

const DEMO_TYPES = [
  { key: 'product', label: 'Product Demo', icon: '🎬', desc: 'End-to-end product value demonstration' },
  { key: 'feature', label: 'Feature Demo', icon: '✨', desc: 'Focused walkthrough for key features' },
  { key: 'enterprise', label: 'Enterprise Demo', icon: '📈', desc: 'Stakeholder-specific strategic demo' },
];

const SALES_PROCESSES = [
  { key: 'qualification', label: 'Lead Qualification', icon: '🎯', desc: 'Score and route inbound leads' },
  { key: 'discovery', label: 'Discovery Call', icon: '🧠', desc: 'Structured discovery and pain mapping' },
  { key: 'proposal', label: 'Proposal Flow', icon: '📄', desc: 'Proposal creation and conversion stages' },
];

const ACTION_COLORS: Record<string, string> = {
  onboarding: '#f59e0b', setup: '#3b82f6', activation: '#10b981', training: '#8b5cf6',
  verification: '#06b6d4', monitoring: '#22c55e', handoff: '#14b8a6', triage: '#f97316',
  analysis: '#a855f7', diagnosis: '#0ea5e9', response: '#6366f1', resolution: '#16a34a',
  documentation: '#64748b', demo: '#ec4899', conversion: '#ef4444', workflow: '#0284c7',
  messaging: '#7c3aed', positioning: '#0891b2', planning: '#f59e0b', media: '#d946ef', default: '#60a5fa',
};
const actionColor = (t?: string) => ACTION_COLORS[t ?? ''] ?? ACTION_COLORS.default;

const OptionGrid: React.FC<{
  options: { key: string; label: string; icon: string; desc: string }[];
  selected: string;
  onSelect: (key: string) => void;
  accent: string;
}> = ({ options, selected, onSelect, accent }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    {options.map((opt) => {
      const active = selected === opt.key;
      return (
        <motion.button
          key={opt.key}
          onClick={() => onSelect(opt.key)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-xl p-4 text-left"
          style={{
            background: active ? `${accent}12` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${active ? `${accent}40` : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <div className="text-2xl mb-2">{opt.icon}</div>
          <div className="text-sm font-bold text-white leading-snug">{opt.label}</div>
          <div className="text-[11px] text-white/40 mt-0.5 leading-snug">{opt.desc}</div>
          {active ? (
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle2 size={11} style={{ color: accent }} />
              <span className="text-[10px] font-semibold" style={{ color: accent }}>Selected</span>
            </div>
          ) : null}
        </motion.button>
      );
    })}
  </div>
);

const ProgressHeader: React.FC<{ stage: BuilderStage; accent: string }> = ({ stage, accent }) => {
  const steps = ['Input', 'AI Generate', 'Review & Save'];
  const activeIndex = stage === 'input' ? 0 : stage === 'generating' ? 1 : 2;

  return (
    <div className="mb-6 rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-2.5 flex-wrap">
        {steps.map((s, i) => {
          const done = i <= activeIndex;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center"
                style={{
                  background: done ? `${accent}25` : 'rgba(255,255,255,0.08)',
                  color: done ? accent : 'rgba(255,255,255,0.45)',
                }}
              >
                {i + 1}
              </div>
              <span className="text-xs font-semibold" style={{ color: done ? '#ffffff' : 'rgba(255,255,255,0.45)' }}>{s}</span>
              {i < steps.length - 1 ? <span className="text-white/25 mx-1">/</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StepCard: React.FC<{
  step: EditableStep;
  index: number;
  accent: string;
  onChange: (id: string, patch: Partial<CustomerStep>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}> = ({ step, index, onChange, onDelete, onToggle }) => {
  const color = actionColor(step.action_type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical size={14} className="text-white/20 cursor-grab flex-shrink-0" />
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: `${color}22`, color }}>
          {index + 1}
        </div>
        <input
          className="flex-1 bg-transparent text-sm font-semibold text-white outline-none min-w-0"
          value={step.title}
          onChange={(e) => onChange(step._id, { title: e.target.value })}
          placeholder="Step title"
        />
        <div className="px-2 py-0.5 rounded-full text-[10px] font-semibold hidden sm:block" style={{ background: `${color}18`, color }}>
          {step.action_type ?? 'action'}
        </div>
        <button onClick={() => onToggle(step._id)} className="p-1 rounded-lg text-white/40 hover:text-white/80 transition-colors">
          {step.expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        <button onClick={() => onDelete(step._id)} className="p-1 rounded-lg text-white/20 hover:text-red-400 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      <AnimatePresence>
        {step.expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Pencil size={10} className="text-white/30" />
                  <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Description</span>
                </div>
                <textarea
                  className="w-full bg-transparent text-xs text-white/70 outline-none resize-none leading-relaxed"
                  rows={2}
                  value={step.description}
                  onChange={(e) => onChange(step._id, { description: e.target.value })}
                  placeholder="Describe this action and expected outcome..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Role</label>
                  <input
                    className="w-full rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    value={step.role ?? ''}
                    onChange={(e) => onChange(step._id, { role: e.target.value })}
                    placeholder="CSM, Support Agent, AE..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Tip</label>
                  <input
                    className="w-full rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    value={step.tip ?? ''}
                    onChange={(e) => onChange(step._id, { tip: e.target.value })}
                    placeholder="Optional best-practice guidance"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Script / Suggested Reply</label>
                  <input
                    className="w-full rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    value={step.script ?? ''}
                    onChange={(e) => onChange(step._id, { script: e.target.value })}
                    placeholder="Customer-facing script text"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Media URL</label>
                  <input
                    className="w-full rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    value={step.media_url ?? ''}
                    onChange={(e) => onChange(step._id, { media_url: e.target.value })}
                    placeholder="https://... (video, loom, docs)"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};

export const CustomerBuilderPage: React.FC<{ config: CustomerBuilderConfig }> = ({ config }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token: authToken } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [stage, setStage] = useState<BuilderStage>('input');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [segment, setSegment] = useState('General');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [selectedVariant, setSelectedVariant] = useState(
    config.inputVariant === 'onboarding-template' ? 'saas'
      : config.inputVariant === 'support-issue' ? 'general'
        : config.inputVariant === 'demo-type' ? 'product' : 'qualification',
  );
  const [steps, setSteps] = useState<EditableStep[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>(config.aiInsights);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedGuideId, setSavedGuideId] = useState<string | null>(null);

  const Icon = config.icon;

  const variantOptions = useMemo(() => {
    if (config.inputVariant === 'onboarding-template') return ONBOARDING_TEMPLATES;
    if (config.inputVariant === 'support-issue') return SUPPORT_ISSUE_TYPES;
    if (config.inputVariant === 'demo-type') return DEMO_TYPES;
    return SALES_PROCESSES;
  }, [config.inputVariant]);

  const toEditable = (raw: CustomerStep[]): EditableStep[] =>
    raw.map((s, i) => ({ ...s, _id: `s${i}-${Date.now()}`, expanded: false }));

  const changeStep = (id: string, patch: Partial<CustomerStep>) =>
    setSteps((prev) => prev.map((s) => (s._id === id ? { ...s, ...patch } : s)));

  const deleteStep = (id: string) => setSteps((prev) => prev.filter((s) => s._id !== id));
  const toggleExpand = (id: string) => setSteps((prev) => prev.map((s) => (s._id === id ? { ...s, expanded: !s.expanded } : s)));

  const addBlankStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        _id: `new-${Date.now()}`,
        title: '',
        description: '',
        action_type: 'action',
        role: '',
        tip: '',
        script: '',
        media_url: '',
        required: false,
        expanded: true,
      },
    ]);
  };

  const ensureAuthenticated = () => {
    if (token) return true;
    setPostAuthRedirect(location.pathname);
    navigate('/signin', { state: { redirectTo: location.pathname } });
    return false;
  };

  const handleGenerate = async () => {
    if (!ensureAuthenticated()) return;
    if (!title.trim()) {
      setError('Add a title first');
      return;
    }
    setError('');
    setStage('generating');

    try {
      const payload: Parameters<typeof api.customerGenerate>[1] = {
        title: title.trim(),
        description: description.trim(),
        customerType: config.customerType,
        segment,
      };
      if (config.inputVariant === 'onboarding-template') payload.templateType = selectedVariant;
      if (config.inputVariant === 'support-issue') payload.issueType = selectedVariant;
      if (config.inputVariant === 'demo-type') payload.demoType = selectedVariant;
      if (config.inputVariant === 'sales-process') payload.salesProcess = selectedVariant;

      const res = await api.customerGenerate(token!, payload);
      setSteps(toEditable(res.steps));
      setAiInsights(res.aiInsights);
      setStage('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed — please try again.');
      setStage('input');
    }
  };

  const handleSave = async () => {
    if (!ensureAuthenticated()) return;
    if (!title.trim() || steps.length === 0) {
      setError('Add title and at least one step before saving.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const cleanSteps = steps
        .map((s, i) => ({
          title: s.title.trim(),
          description: s.description.trim(),
          action_type: s.action_type || 'action',
          role: (s.role || '').trim(),
          tip: (s.tip || '').trim(),
          script: (s.script || '').trim(),
          media_url: (s.media_url || '').trim(),
          required: Boolean(s.required),
          order: i + 1,
        }))
        .filter((s) => s.title.length > 0);

      if (!cleanSteps.length) {
        setError('All steps are empty. Add at least one valid step.');
        setSaving(false);
        return;
      }

      const res = await api.customerCreate(token!, {
        title: title.trim(),
        description: description.trim(),
        source: config.customerType,
        status,
        category: config.customerType,
        tags: [selectedVariant, segment],
        steps: cleanSteps,
      });

      setSavedGuideId(res.guide.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (stage === 'generating') {
    return (
      <AppShell>
        <ProgressHeader stage={stage} accent={config.accent} />
        <div className="min-h-[55vh] flex flex-col items-center justify-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${config.accent}18` }}>
            <Sparkles size={28} style={{ color: config.accent }} className="animate-pulse" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-white mb-2">AI is generating your workflow</h2>
            <p className="text-white/50 text-sm">Building a reusable customer interaction playbook...</p>
          </div>
          <div className="space-y-2 w-full max-w-sm">
            {['Analyzing pattern...', 'Applying best-practice sequence...', 'Adding scripts and suggestions...', 'Preparing save-ready workflow...'].map((line, i) => (
              <motion.div
                key={line}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.35 }}
                className="flex items-center gap-2"
              >
                <Loader2 size={12} className="animate-spin flex-shrink-0" style={{ color: config.accent }} />
                <span className="text-xs text-white/55">{line}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (savedGuideId) {
    return (
      <AppShell>
        <ProgressHeader stage="review" accent={config.accent} />
        <div className="min-h-[55vh] flex flex-col items-center justify-center gap-6 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `${config.accent}20` }}>
            <Rocket size={34} style={{ color: config.accent }} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white mb-2">
              {status === 'published' ? 'Workflow Published!' : 'Workflow Saved!'}
            </h2>
            <p className="text-white/50 text-sm">Your customer-facing workflow is now reusable across the team.</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <motion.button
              onClick={() => navigate(`/guides/${savedGuideId}`)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: `linear-gradient(135deg, ${config.accent}, ${config.secondaryAccent})` }}
              whileHover={{ scale: 1.03 }}
            >
              <ExternalLink size={14} /> View Guide
            </motion.button>
            <motion.button
              onClick={() => {
                setSavedGuideId(null);
                setStage('input');
                setTitle('');
                setDescription('');
                setSteps([]);
                setAiInsights(config.aiInsights);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white/60"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}
              whileHover={{ scale: 1.02 }}
            >
              Build another
            </motion.button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (stage === 'input') {
    return (
      <AppShell>
        <ProgressHeader stage={stage} accent={config.accent} />
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${config.accent}18` }}>
              <Icon size={22} strokeWidth={1.7} style={{ color: config.accent }} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{config.label}</h1>
              <p className="text-sm text-white/50 mt-0.5">{config.tagline}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Title *</label>
                <input
                  className="w-full rounded-xl px-4 py-3 text-white text-sm font-medium outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  placeholder={config.titlePlaceholder}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Segment</label>
                <input
                  className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  placeholder="SMB, Mid-market, Enterprise, Healthcare, Fintech..."
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Workflow type</label>
                <OptionGrid options={variantOptions} selected={selectedVariant} onSelect={setSelectedVariant} accent={config.accent} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Additional context</label>
                <textarea
                  className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  rows={3}
                  placeholder={config.descriptionPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {error ? <p className="text-red-400 text-xs">{error}</p> : null}

              <motion.button
                onClick={handleGenerate}
                disabled={!title.trim()}
                className="flex items-center gap-2 px-7 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${config.accent}, ${config.secondaryAccent})` }}
                whileHover={{ scale: title.trim() ? 1.03 : 1 }}
              >
                <Sparkles size={14} /> {config.generateLabel}
              </motion.button>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl p-4" style={{ background: `${config.accent}08`, border: `1px solid ${config.accent}22` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={13} style={{ color: config.accent }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: config.accent }}>AI Suggestions</span>
                </div>
                <div className="space-y-2">
                  {aiInsights.map((insight) => (
                    <div key={insight} className="flex items-start gap-2">
                      <CheckCircle2 size={11} className="flex-shrink-0 mt-0.5" style={{ color: config.accent }} />
                      <span className="text-xs text-white/60 leading-snug">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Output includes</p>
                <div className="space-y-2.5">
                  {[
                    'Step editor with scripts and role ownership',
                    'AI optimization recommendations',
                    'Video/media links per step',
                    'Save as draft or publish for team reuse',
                    'Knowledge-base ready guide output',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 size={11} className="text-white/20 flex-shrink-0" />
                      <span className="text-xs text-white/50">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ProgressHeader stage={stage} accent={config.accent} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <button
            onClick={() => setStage('input')}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft size={14} /> Back to input
          </button>
          <div className="flex items-center gap-2.5">
            <div className="inline-flex rounded-lg overflow-hidden border border-white/15">
              <button
                onClick={() => setStatus('draft')}
                className="px-3 py-1.5 text-xs font-semibold"
                style={{ background: status === 'draft' ? 'rgba(255,255,255,0.12)' : 'transparent', color: status === 'draft' ? '#ffffff' : 'rgba(255,255,255,0.5)' }}
              >
                Draft
              </button>
              <button
                onClick={() => setStatus('published')}
                className="px-3 py-1.5 text-xs font-semibold"
                style={{ background: status === 'published' ? `${config.accent}35` : 'transparent', color: status === 'published' ? '#ffffff' : 'rgba(255,255,255,0.5)' }}
              >
                Publish
              </button>
            </div>
            <motion.button
              onClick={handleSave}
              disabled={saving || steps.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${config.accent}, ${config.secondaryAccent})` }}
              whileHover={{ scale: 1.03 }}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />}
              {saving ? 'Saving...' : config.saveLabel}
            </motion.button>
          </div>
        </div>

        {error ? <p className="text-red-400 text-xs mb-3">{error}</p> : null}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-white">{title}</h2>
              <span className="text-xs text-white/35">{steps.length} steps</span>
            </div>

            <AnimatePresence mode="popLayout">
              {steps.map((step, i) => (
                <StepCard
                  key={step._id}
                  step={step}
                  index={i}
                  accent={config.accent}
                  onChange={changeStep}
                  onDelete={deleteStep}
                  onToggle={toggleExpand}
                />
              ))}
            </AnimatePresence>

            <motion.button
              onClick={addBlankStep}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors"
              style={{ border: '1px dashed rgba(255,255,255,0.14)' }}
              whileHover={{ scale: 1.01 }}
            >
              <Plus size={13} /> Add step
            </motion.button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl p-4" style={{ background: `${config.accent}08`, border: `1px solid ${config.accent}22` }}>
              <div className="flex items-center gap-2 mb-3">
                <Brain size={13} style={{ color: config.accent }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: config.accent }}>AI panel</span>
              </div>
              <div className="space-y-2">
                {aiInsights.map((insight) => (
                  <div key={insight} className="flex items-start gap-2">
                    <Lightbulb size={11} className="flex-shrink-0 mt-0.5" style={{ color: config.accent }} />
                    <span className="text-xs text-white/60 leading-snug">{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Execution metrics</p>
              <div className="space-y-2 text-xs text-white/60">
                <div className="flex justify-between">
                  <span className="inline-flex items-center gap-1"><Users size={11} /> Segment</span>
                  <span className="text-white/80">{segment || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Steps</span>
                  <span className="text-white/80">{steps.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="inline-flex items-center gap-1"><PlayCircle size={11} /> Media links</span>
                  <span className="text-white/80">{steps.filter((s) => (s.media_url || '').trim().length > 0).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Scripts added</span>
                  <span className="text-white/80">{steps.filter((s) => (s.script || '').trim().length > 0).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
};
