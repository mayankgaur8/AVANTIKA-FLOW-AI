/**
 * ITBuilderPage — shared AI-powered builder for 4 IT workflow systems:
 *   /it/onboarding-guides    → System Onboarding Guides   (role-picker input)
 *   /it/troubleshooting      → Troubleshooting Docs       (log-input)
 *   /it/devops-runbooks      → DevOps Runbooks            (runbook-type picker)
 *   /it/software-tutorials   → Software Setup Tutorials   (tool-picker)
 *
 * Each entry point is a thin wrapper supplying an ITBuilderConfig.
 * All state, generation, editing, and saving lives here.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles, ArrowLeft, Loader2, CheckCircle2, GripVertical,
  Trash2, Plus, ChevronDown, ChevronUp, Rocket, ExternalLink,
  Brain, Lightbulb, Shield, AlertTriangle, Pencil,
  type LucideIcon,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type ITStep, type ITBuilderType } from '../lib/api';

// ─── Config interface ─────────────────────────────────────────────────────────

export type ITInputVariant = 'role-picker' | 'log-input' | 'runbook-type' | 'tool-picker';

export interface ITBuilderConfig {
  itType: ITBuilderType;
  inputVariant: ITInputVariant;
  label: string;
  tagline: string;
  accent: string;
  secondaryAccent: string;
  icon: LucideIcon;
  /** Shown as main title field placeholder */
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  /** Show per-step role field */
  showRole: boolean;
  /** Show per-step verification field */
  showVerification: boolean;
  aiInsights: string[];
  generateLabel: string;
  saveLabel: string;
}

// ─── Variant data ─────────────────────────────────────────────────────────────

const ROLES = [
  { key: 'developer', label: 'Developer', icon: '💻', desc: 'Git, IDE, CI/CD, cloud access' },
  { key: 'analyst',   label: 'Analyst',   icon: '📊', desc: 'BI tools, data warehouse, dashboards' },
  { key: 'hr',        label: 'HR',        icon: '👥', desc: 'HRIS, payroll, compliance systems' },
  { key: 'custom',    label: 'Custom',    icon: '⚙️', desc: 'Define your own role requirements' },
];

const RUNBOOK_TYPES = [
  { key: 'deployment', label: 'Deployment',       icon: '🚀', desc: 'Ship code safely from CI to production' },
  { key: 'rollback',   label: 'Rollback',          icon: '↩️', desc: 'Revert to last stable version fast' },
  { key: 'incident',   label: 'Incident Response', icon: '🚨', desc: 'Detect, triage, and resolve outages' },
  { key: 'maintenance',label: 'Maintenance',       icon: '🔧', desc: 'Scheduled downtime and patching windows' },
];

const TOOLS = [
  { key: 'jira',     label: 'Jira',      icon: '📋', desc: 'Project tracking and sprint management' },
  { key: 'github',   label: 'GitHub',    icon: '🐙', desc: 'Version control and pull request workflow' },
  { key: 'vscode',   label: 'VS Code',   icon: '🖥️', desc: 'Editor setup, extensions, debugging' },
  { key: 'internal', label: 'Internal Tool', icon: '🏢', desc: 'Any proprietary or custom software' },
];

// ─── Action colours ───────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  setup: '#3b82f6', installation: '#6366f1', configuration: '#8b5cf6',
  security: '#ef4444', training: '#f59e0b', verification: '#06b6d4',
  documentation: '#a855f7', communication: '#14b8a6', action: '#10b981',
  monitoring: '#f97316', investigation: '#38bdf8', resolution: '#ec4899',
  deployment: '#22c55e', approval: '#fb923c', planning: '#64748b',
  default: '#60a5fa',
};
const actionColor = (t?: string) => ACTION_COLORS[t ?? ''] ?? ACTION_COLORS.default;

type BuilderStage = 'input' | 'generating' | 'review';

interface EditableStep extends ITStep {
  _id: string;
  expanded: boolean;
}

// ─── Step Card ────────────────────────────────────────────────────────────────

const StepCard: React.FC<{
  step: EditableStep;
  index: number;
  config: ITBuilderConfig;
  onChange: (id: string, patch: Partial<ITStep>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}> = ({ step, index, config, onChange, onDelete, onToggle }) => {
  const color = actionColor(step.action_type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical size={14} className="text-white/20 cursor-grab flex-shrink-0" />
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
          style={{ background: `${color}22`, color }}
        >
          {index + 1}
        </div>
        <input
          className="flex-1 bg-transparent text-sm font-semibold text-white outline-none min-w-0"
          value={step.title}
          onChange={(e) => onChange(step._id, { title: e.target.value })}
          placeholder="Step title"
        />
        <div className="flex items-center gap-1 flex-shrink-0">
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
      </div>

      <AnimatePresence>
        {step.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Description */}
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
                  placeholder="Describe what happens in this step…"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Role (optional) */}
                {config.showRole && (
                  <div>
                    <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
                      Responsible Role
                    </label>
                    <input
                      className="w-full rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      value={step.role ?? ''}
                      onChange={(e) => onChange(step._id, { role: e.target.value })}
                      placeholder="e.g. IT Admin, DevOps Engineer"
                    />
                  </div>
                )}

                {/* Tip */}
                <div>
                  <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
                    <Lightbulb size={9} className="inline mr-1" />Pro Tip
                  </label>
                  <input
                    className="w-full rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    value={step.tip ?? ''}
                    onChange={(e) => onChange(step._id, { tip: e.target.value })}
                    placeholder="Best practice or common mistake…"
                  />
                </div>
              </div>

              {/* Verification (optional) */}
              {config.showVerification && (
                <div>
                  <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
                    <Shield size={9} className="inline mr-1" />Verification Check
                  </label>
                  <input
                    className="w-full rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    value={step.verification ?? ''}
                    onChange={(e) => onChange(step._id, { verification: e.target.value })}
                    placeholder="How to confirm this step is complete…"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── AI Insights Panel ────────────────────────────────────────────────────────

const AiInsightsPanel: React.FC<{ insights: string[]; accent: string }> = ({ insights, accent }) => (
  <div className="rounded-2xl p-4" style={{ background: `${accent}08`, border: `1px solid ${accent}22` }}>
    <div className="flex items-center gap-2 mb-3">
      <Brain size={13} style={{ color: accent }} />
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>AI Analysis</span>
    </div>
    <div className="space-y-2">
      {insights.map((insight) => (
        <div key={insight} className="flex items-start gap-2">
          <CheckCircle2 size={11} className="flex-shrink-0 mt-0.5" style={{ color: accent }} />
          <span className="text-xs text-white/60 leading-snug">{insight}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Variant-specific pickers ─────────────────────────────────────────────────

const OptionGrid: React.FC<{
  options: { key: string; label: string; icon: string; desc: string }[];
  selected: string;
  onSelect: (key: string) => void;
  accent: string;
}> = ({ options, selected, onSelect, accent }) => (
  <div className="grid grid-cols-2 gap-3">
    {options.map((opt) => {
      const active = selected === opt.key;
      return (
        <motion.button
          key={opt.key}
          onClick={() => onSelect(opt.key)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-xl p-4 text-left transition-all"
          style={{
            background: active ? `${accent}12` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${active ? `${accent}40` : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <div className="text-2xl mb-2">{opt.icon}</div>
          <div className="text-sm font-bold text-white leading-snug">{opt.label}</div>
          <div className="text-[11px] text-white/40 mt-0.5 leading-snug">{opt.desc}</div>
          {active && (
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle2 size={11} style={{ color: accent }} />
              <span className="text-[10px] font-semibold" style={{ color: accent }}>Selected</span>
            </div>
          )}
        </motion.button>
      );
    })}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const ITBuilderPage: React.FC<{ config: ITBuilderConfig }> = ({ config }) => {
  const navigate = useNavigate();
  const { token: authToken } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [stage, setStage] = useState<BuilderStage>('input');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorLog, setErrorLog] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(
    config.inputVariant === 'role-picker'    ? 'developer'   :
    config.inputVariant === 'runbook-type'   ? 'deployment'  :
    config.inputVariant === 'tool-picker'    ? 'jira'        : '',
  );
  const [steps, setSteps] = useState<EditableStep[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>(config.aiInsights);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedGuideId, setSavedGuideId] = useState<string | null>(null);

  const Icon = config.icon;

  // ─── Step helpers ────────────────────────────────────────────────────────

  const toEditable = (raw: ITStep[]): EditableStep[] =>
    raw.map((s, i) => ({ ...s, _id: `s${i}-${Date.now()}`, expanded: false }));

  const changeStep = (id: string, patch: Partial<ITStep>) =>
    setSteps((prev) => prev.map((s) => s._id === id ? { ...s, ...patch } : s));

  const deleteStep = (id: string) =>
    setSteps((prev) => prev.filter((s) => s._id !== id));

  const toggleExpand = (id: string) =>
    setSteps((prev) => prev.map((s) => s._id === id ? { ...s, expanded: !s.expanded } : s));

  const addBlankStep = () =>
    setSteps((prev) => [
      ...prev,
      { _id: `new-${Date.now()}`, title: '', description: '', action_type: 'action', expanded: true, role: '', tip: '', verification: '' },
    ]);

  // ─── Generate ────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!title.trim()) { setError('Add a title first'); return; }
    setError('');
    setStage('generating');

    try {
      const payload: Parameters<typeof api.itGenerate>[1] = {
        title: title.trim(),
        description: description.trim(),
        itType: config.itType,
      };
      if (config.inputVariant === 'role-picker')  payload.role       = selectedVariant;
      if (config.inputVariant === 'log-input')    payload.errorLog   = errorLog.trim();
      if (config.inputVariant === 'runbook-type') payload.runbookType = selectedVariant;
      if (config.inputVariant === 'tool-picker')  payload.tool       = selectedVariant;

      const res = await api.itGenerate(token!, payload);
      setSteps(toEditable(res.steps));
      setAiInsights(res.aiInsights);
      setStage('review');
    } catch {
      setError('Generation failed — please try again');
      setStage('input');
    }
  };

  // ─── Save ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!token || steps.length === 0) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.itCreate(token, {
        title,
        description,
        source: config.itType,
        steps: steps.map(({ title: t, description: d, action_type, role, tip, verification, order }) => ({
          title: t, description: d, action_type, role, tip, verification, order,
        })),
      });
      setSavedGuideId(res.guide.id);
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── STAGE: GENERATING ────────────────────────────────────────────────────

  if (stage === 'generating') {
    const genSteps = [
      'Analyzing input and context…',
      'Matching against IT knowledge patterns…',
      'Generating step-by-step workflow…',
      'Adding AI insights and recommendations…',
      'Finalizing your guide…',
    ];
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${config.accent}18` }}>
            <Sparkles size={28} style={{ color: config.accent }} className="animate-pulse" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-white mb-2">AI is building your guide</h2>
            <p className="text-white/50 text-sm">Generating an expert-level IT workflow…</p>
          </div>
          <div className="space-y-2 w-full max-w-xs">
            {genSteps.map((s, i) => (
              <motion.div
                key={s}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.4 }}
                className="flex items-center gap-2"
              >
                <Loader2 size={12} className="animate-spin flex-shrink-0" style={{ color: config.accent }} />
                <span className="text-xs text-white/50">{s}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  // ─── STAGE: SUCCESS ───────────────────────────────────────────────────────

  if (savedGuideId) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: `${config.accent}20` }}
          >
            <Rocket size={36} style={{ color: config.accent }} />
          </motion.div>
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Guide published!</h2>
            <p className="text-white/50 text-sm">Your IT workflow is ready to assign and execute.</p>
          </div>
          <div className="flex gap-3">
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
                setStage('input');
                setTitle('');
                setDescription('');
                setErrorLog('');
                setSteps([]);
                setSavedGuideId(null);
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

  // ─── STAGE: INPUT ─────────────────────────────────────────────────────────

  const renderVariantInput = () => {
    switch (config.inputVariant) {
      case 'role-picker':
        return (
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Select role to onboard
            </label>
            <OptionGrid options={ROLES} selected={selectedVariant} onSelect={setSelectedVariant} accent={config.accent} />
          </div>
        );

      case 'log-input':
        return (
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Error log or issue description
            </label>
            <textarea
              className="w-full rounded-xl px-4 py-3 text-white/80 text-xs font-mono outline-none resize-none transition-all leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
              rows={6}
              placeholder="Paste error message, stack trace, or describe the issue in detail…&#10;&#10;e.g. ERROR 500: Connection refused at /api/auth after deploy&#10;      at node_modules/pg/lib/connection.js:54"
              value={errorLog}
              onChange={(e) => setErrorLog(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = `${config.accent}50`)}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <p className="text-[11px] text-white/25 mt-1.5">AI detects the error pattern and generates targeted fix steps.</p>
          </div>
        );

      case 'runbook-type':
        return (
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Select runbook type
            </label>
            <OptionGrid options={RUNBOOK_TYPES} selected={selectedVariant} onSelect={setSelectedVariant} accent={config.accent} />
          </div>
        );

      case 'tool-picker':
        return (
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Select tool to document
            </label>
            <OptionGrid options={TOOLS} selected={selectedVariant} onSelect={setSelectedVariant} accent={config.accent} />
          </div>
        );
    }
  };

  if (stage === 'input') {
    return (
      <AppShell>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
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
            {/* Left: form */}
            <div className="lg:col-span-3 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Title *</label>
                <input
                  className="w-full rounded-xl px-4 py-3 text-white text-sm font-medium outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  placeholder={config.titlePlaceholder}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = `${config.accent}60`)}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
              </div>

              {/* Variant-specific input */}
              {renderVariantInput()}

              {/* Context / description */}
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Additional context
                </label>
                <textarea
                  className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none resize-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  rows={3}
                  placeholder={config.descriptionPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = `${config.accent}60`)}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <div className="flex items-center gap-3 pt-2">
                <motion.button
                  onClick={handleGenerate}
                  disabled={!title.trim()}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: `linear-gradient(135deg, ${config.accent}, ${config.secondaryAccent})` }}
                  whileHover={{ scale: title.trim() ? 1.03 : 1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Sparkles size={14} /> {config.generateLabel}
                </motion.button>
                <span className="text-xs text-white/30">AI generates steps in seconds</span>
              </div>
            </div>

            {/* Right: AI hints */}
            <div className="lg:col-span-2 space-y-4">
              <AiInsightsPanel insights={config.aiInsights} accent={config.accent} />
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">What you'll get</p>
                <div className="space-y-2.5">
                  {[
                    'Step-by-step actionable guide',
                    config.showRole ? 'Role assigned per step' : 'Action types for each step',
                    config.showVerification ? 'Verification checks included' : 'AI-generated pro tips',
                    'Edit, reorder, and enrich steps',
                    'Save as draft or publish instantly',
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

  // ─── STAGE: REVIEW ────────────────────────────────────────────────────────

  const actionTypeCounts = steps.reduce<Record<string, number>>((acc, s) => {
    const t = s.action_type ?? 'action';
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  const topTypes = Object.entries(actionTypeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <button
            onClick={() => setStage('input')}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft size={14} /> Back to input
          </button>

          <div className="flex items-center gap-3">
            {error && <span className="text-red-400 text-xs">{error}</span>}
            <motion.button
              onClick={handleSave}
              disabled={saving || steps.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${config.accent}, ${config.secondaryAccent})` }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />}
              {saving ? 'Saving…' : config.saveLabel}
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Steps list */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-white">{title}</h2>
              <span className="text-xs text-white/30">{steps.length} steps</span>
            </div>

            <AnimatePresence mode="popLayout">
              {steps.map((step, i) => (
                <StepCard
                  key={step._id}
                  step={step}
                  index={i}
                  config={config}
                  onChange={changeStep}
                  onDelete={deleteStep}
                  onToggle={toggleExpand}
                />
              ))}
            </AnimatePresence>

            <motion.button
              onClick={addBlankStep}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors"
              style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
              whileHover={{ scale: 1.01 }}
            >
              <Plus size={13} /> Add step
            </motion.button>
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stats */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Guide stats</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Steps', value: steps.length },
                  { label: 'Est. time', value: `${Math.max(5, steps.length * 3)}–${steps.length * 6} min` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="text-xl font-black text-white">{stat.value}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
              {topTypes.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {topTypes.map(([type, count]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: actionColor(type) }} />
                      <span className="text-xs text-white/50 flex-1 capitalize">{type}</span>
                      <span className="text-xs text-white/30">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AiInsightsPanel insights={aiInsights} accent={config.accent} />

            {/* Warning if no steps */}
            {steps.length === 0 && (
              <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">Add at least one step before saving.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
};
