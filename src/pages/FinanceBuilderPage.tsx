/**
 * FinanceBuilderPage — shared AI-powered builder for 4 Finance workflow systems:
 *   /finance/invoice-processing → Invoice Processing Workflows (invoice-type picker)
 *   /finance/expense-approvals  → Expense Approval SOPs       (expense-category picker)
 *   /finance/audit-docs         → Audit Documentation         (process picker)
 *   /finance/tool-training      → Financial Tool Training     (tool picker)
 *
 * Each entry point is a thin wrapper supplying a FinanceBuilderConfig.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles, ArrowLeft, Loader2, CheckCircle2, GripVertical,
  Trash2, Plus, ChevronDown, ChevronUp, Rocket, ExternalLink,
  Brain, Lightbulb, Shield, AlertTriangle, Pencil, ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type FinanceStep, type FinanceBuilderType } from '../lib/api';

// ─── Config interface ─────────────────────────────────────────────────────────

export type FinanceInputVariant =
  | 'invoice-type'
  | 'expense-category'
  | 'process-picker'
  | 'tool-picker';

export interface FinanceBuilderConfig {
  financeType: FinanceBuilderType;
  inputVariant: FinanceInputVariant;
  label: string;
  tagline: string;
  accent: string;
  secondaryAccent: string;
  icon: LucideIcon;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  showApprovalLevel: boolean;
  showComplianceNote: boolean;
  showRole: boolean;
  aiInsights: string[];
  generateLabel: string;
  saveLabel: string;
}

// ─── Variant option data ──────────────────────────────────────────────────────

const INVOICE_TYPES = [
  { key: 'ap',     label: 'Accounts Payable',  icon: '💳', desc: 'Standard vendor invoice processing' },
  { key: 'vendor', label: 'New Vendor',         icon: '🏢', desc: 'First-time vendor setup and payment' },
  { key: 'recurring', label: 'Recurring',       icon: '🔄', desc: 'Subscriptions and scheduled payments' },
  { key: 'po',     label: 'PO-Based',           icon: '📋', desc: 'Three-way match against purchase order' },
];

const EXPENSE_CATEGORIES = [
  { key: 'travel',    label: 'Travel & Entertainment', icon: '✈️',  desc: 'Flights, hotels, meals, transportation' },
  { key: 'software',  label: 'Software & SaaS',        icon: '💻',  desc: 'Subscriptions, licenses, cloud tools' },
  { key: 'equipment', label: 'Equipment & Hardware',   icon: '🖥️', desc: 'Devices, peripherals, office gear' },
  { key: 'general',   label: 'General Business',       icon: '📊',  desc: 'Supplies, professional services, other' },
];

const AUDIT_PROCESSES = [
  { key: 'invoice', label: 'Invoice Approval Trail', icon: '📄', desc: 'AP and vendor invoice transactions' },
  { key: 'expense', label: 'Expense Report Audit',   icon: '💰', desc: 'Employee expense submissions' },
  { key: 'payment', label: 'Payment Authorization',  icon: '🏦', desc: 'Bank payments and wire transfers' },
  { key: 'general', label: 'General Financial Audit',icon: '📋', desc: 'Full-scope financial process review' },
];

const FINANCE_TOOLS = [
  { key: 'sap',        label: 'SAP',              icon: '🔷', desc: 'ERP finance and accounting modules' },
  { key: 'oracle',     label: 'Oracle Financials', icon: '🔴', desc: 'Oracle Cloud or E-Business Suite' },
  { key: 'quickbooks', label: 'QuickBooks',        icon: '🟢', desc: 'Small and mid-size business accounting' },
  { key: 'erp',        label: 'Custom ERP',        icon: '⚙️', desc: 'Any proprietary financial system' },
];

// ─── Approval level labels & colors ──────────────────────────────────────────

const APPROVAL_META: Record<string, { label: string; color: string }> = {
  auto:    { label: 'Auto',    color: '#10b981' },
  manager: { label: 'Manager', color: '#3b82f6' },
  finance: { label: 'Finance', color: '#f59e0b' },
  cfo:     { label: 'CFO',     color: '#ef4444' },
};

// ─── Action colors ────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  'data-entry': '#f59e0b', verification: '#06b6d4', approval: '#8b5cf6',
  accounting: '#10b981', action: '#3b82f6', documentation: '#6366f1',
  communication: '#14b8a6', planning: '#64748b', review: '#a855f7',
  setup: '#60a5fa', security: '#ef4444', training: '#fbbf24',
  investigation: '#38bdf8', confirmation: '#34d399', default: '#60a5fa',
};
const actionColor = (t?: string) => ACTION_COLORS[t ?? ''] ?? ACTION_COLORS.default;

type BuilderStage = 'input' | 'generating' | 'review';

interface EditableStep extends FinanceStep {
  _id: string;
  expanded: boolean;
}

// ─── Option Grid ──────────────────────────────────────────────────────────────

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

// ─── Step Card ────────────────────────────────────────────────────────────────

const StepCard: React.FC<{
  step: EditableStep;
  index: number;
  config: FinanceBuilderConfig;
  onChange: (id: string, patch: Partial<FinanceStep>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}> = ({ step, index, config, onChange, onDelete, onToggle }) => {
  const color = actionColor(step.action_type);
  const appMeta = APPROVAL_META[step.approval_level ?? 'auto'];

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
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {config.showApprovalLevel && appMeta && (
            <div
              className="px-2 py-0.5 rounded-full text-[10px] font-bold hidden sm:block"
              style={{ background: `${appMeta.color}15`, color: appMeta.color }}
            >
              {appMeta.label}
            </div>
          )}
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
                {/* Approval level */}
                {config.showApprovalLevel && (
                  <div>
                    <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
                      Approval Level
                    </label>
                    <select
                      className="w-full rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                      value={step.approval_level ?? 'auto'}
                      onChange={(e) => onChange(step._id, { approval_level: e.target.value as FinanceStep['approval_level'] })}
                    >
                      <option value="auto">Auto (no approval)</option>
                      <option value="manager">Manager approval</option>
                      <option value="finance">Finance approval</option>
                      <option value="cfo">CFO / VP approval</option>
                    </select>
                  </div>
                )}

                {/* Role */}
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
                      placeholder="e.g. AP Clerk, Controller, CFO"
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

              {/* Compliance note */}
              {config.showComplianceNote && (
                <div>
                  <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
                    <ShieldCheck size={9} className="inline mr-1" />Compliance / Policy Reference
                  </label>
                  <input
                    className="w-full rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    value={step.compliance_note ?? ''}
                    onChange={(e) => onChange(step._id, { compliance_note: e.target.value })}
                    placeholder="e.g. SOX Section 404, GAAP ASC 606, T&E Policy §3.2…"
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

// ─── Approval Legend ──────────────────────────────────────────────────────────

const ApprovalLegend: React.FC = () => (
  <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
    <div className="flex items-center gap-2 mb-3">
      <Shield size={12} className="text-white/30" />
      <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">Approval tiers</span>
    </div>
    <div className="space-y-2">
      {Object.entries(APPROVAL_META).map(([key, meta]) => (
        <div key={key} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
          <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
          <span className="text-xs text-white/30">
            {key === 'auto'    && '— system or below-threshold'}
            {key === 'manager' && '— direct manager sign-off'}
            {key === 'finance' && '— finance team or Controller'}
            {key === 'cfo'     && '— CFO or VP-level required'}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const FinanceBuilderPage: React.FC<{ config: FinanceBuilderConfig }> = ({ config }) => {
  const navigate = useNavigate();
  const { token: authToken } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [stage, setStage] = useState<BuilderStage>('input');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(
    config.inputVariant === 'invoice-type'       ? 'ap'       :
    config.inputVariant === 'expense-category'   ? 'general'  :
    config.inputVariant === 'process-picker'     ? 'general'  :
    config.inputVariant === 'tool-picker'        ? 'erp'      : 'general',
  );
  const [steps, setSteps] = useState<EditableStep[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>(config.aiInsights);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedGuideId, setSavedGuideId] = useState<string | null>(null);

  const Icon = config.icon;

  // ─── Step helpers ────────────────────────────────────────────────────────

  const toEditable = (raw: FinanceStep[]): EditableStep[] =>
    raw.map((s, i) => ({ ...s, _id: `s${i}-${Date.now()}`, expanded: false }));

  const changeStep = (id: string, patch: Partial<FinanceStep>) =>
    setSteps((prev) => prev.map((s) => s._id === id ? { ...s, ...patch } : s));

  const deleteStep = (id: string) =>
    setSteps((prev) => prev.filter((s) => s._id !== id));

  const toggleExpand = (id: string) =>
    setSteps((prev) => prev.map((s) => s._id === id ? { ...s, expanded: !s.expanded } : s));

  const addBlankStep = () =>
    setSteps((prev) => [
      ...prev,
      { _id: `new-${Date.now()}`, title: '', description: '', action_type: 'action', approval_level: 'auto', expanded: true, role: '', tip: '', compliance_note: '' },
    ]);

  // ─── Generate ────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!title.trim()) { setError('Add a title first'); return; }
    setError('');
    setStage('generating');

    try {
      const payload: Parameters<typeof api.financeGenerate>[1] = {
        title: title.trim(),
        description: description.trim(),
        financeType: config.financeType,
      };
      if (config.inputVariant === 'invoice-type')     payload.invoiceSubtype  = selectedVariant;
      if (config.inputVariant === 'expense-category') payload.expenseCategory = selectedVariant;
      if (config.inputVariant === 'process-picker')   payload.auditProcess    = selectedVariant;
      if (config.inputVariant === 'tool-picker')      payload.tool            = selectedVariant;

      const res = await api.financeGenerate(token!, payload);
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
      const res = await api.financeCreate(token, {
        title,
        description,
        source: config.financeType,
        steps: steps.map(({ title: t, description: d, action_type, approval_level, role, tip, compliance_note, order }) => ({
          title: t, description: d, action_type, approval_level, role, tip, compliance_note, order,
        })),
      });
      setSavedGuideId(res.guide.id);
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── GENERATING stage ─────────────────────────────────────────────────────

  if (stage === 'generating') {
    const genSteps = [
      'Analyzing workflow requirements…',
      'Matching against finance policy patterns…',
      'Building approval routing logic…',
      'Adding compliance checkpoints…',
      'Finalizing your guide…',
    ];
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${config.accent}18` }}>
            <Sparkles size={28} style={{ color: config.accent }} className="animate-pulse" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-white mb-2">AI is building your workflow</h2>
            <p className="text-white/50 text-sm">Generating a policy-compliant, audit-ready finance guide…</p>
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

  // ─── SUCCESS state ────────────────────────────────────────────────────────

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
            <h2 className="text-3xl font-black text-white mb-2">Workflow published!</h2>
            <p className="text-white/50 text-sm">Your finance workflow is ready to assign, execute, and audit.</p>
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
                setStage('input');
                setTitle('');
                setDescription('');
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

  // ─── Variant-specific input section ──────────────────────────────────────

  const renderVariantInput = () => {
    switch (config.inputVariant) {
      case 'invoice-type':
        return (
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Select invoice type
            </label>
            <OptionGrid options={INVOICE_TYPES} selected={selectedVariant} onSelect={setSelectedVariant} accent={config.accent} />
          </div>
        );
      case 'expense-category':
        return (
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Select expense category
            </label>
            <OptionGrid options={EXPENSE_CATEGORIES} selected={selectedVariant} onSelect={setSelectedVariant} accent={config.accent} />
          </div>
        );
      case 'process-picker':
        return (
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Select process to audit
            </label>
            <OptionGrid options={AUDIT_PROCESSES} selected={selectedVariant} onSelect={setSelectedVariant} accent={config.accent} />
          </div>
        );
      case 'tool-picker':
        return (
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Select financial system
            </label>
            <OptionGrid options={FINANCE_TOOLS} selected={selectedVariant} onSelect={setSelectedVariant} accent={config.accent} />
          </div>
        );
    }
  };

  // ─── INPUT stage ──────────────────────────────────────────────────────────

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

              {renderVariantInput()}

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
                <span className="text-xs text-white/30">AI generates in seconds</span>
              </div>
            </div>

            {/* Right: hints */}
            <div className="lg:col-span-2 space-y-4">
              <AiInsightsPanel insights={config.aiInsights} accent={config.accent} />
              {config.showApprovalLevel && <ApprovalLegend />}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">What you'll get</p>
                <div className="space-y-2.5">
                  {[
                    'Policy-compliant step-by-step workflow',
                    config.showApprovalLevel ? 'Approval routing per spend threshold' : 'Role assignments per step',
                    config.showComplianceNote ? 'Compliance and policy references' : 'AI-generated best practice tips',
                    'Edit, reorder, and enrich steps',
                    'Audit-ready — save as draft or publish',
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

  // ─── REVIEW stage ─────────────────────────────────────────────────────────

  const approvalCounts = steps.reduce<Record<string, number>>((acc, s) => {
    const k = s.approval_level ?? 'auto';
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

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

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stats */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Guide stats</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { label: 'Steps', value: steps.length },
                  { label: 'Est. time', value: `${Math.max(5, steps.length * 4)}–${steps.length * 8} min` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="text-xl font-black text-white">{stat.value}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Approval breakdown */}
              {config.showApprovalLevel && Object.keys(approvalCounts).length > 0 && (
                <div className="space-y-1.5 border-t border-white/5 pt-3">
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">Approval breakdown</p>
                  {Object.entries(approvalCounts).map(([level, count]) => {
                    const meta = APPROVAL_META[level];
                    return (
                      <div key={level} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta?.color ?? '#60a5fa' }} />
                        <span className="text-xs text-white/50 flex-1">{meta?.label ?? level}</span>
                        <span className="text-xs text-white/30">{count} step{count !== 1 ? 's' : ''}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action type breakdown */}
              {topTypes.length > 0 && (
                <div className="space-y-1.5 border-t border-white/5 pt-3 mt-2">
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">Step types</p>
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
