import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Video, Type, FileUp, Youtube, LayoutTemplate,
  ArrowRight, ArrowLeft, Sparkles, CheckCircle2,
  Loader2, GripVertical, Pencil, Trash2, Plus,
  Rocket, Share2, ExternalLink, ChevronDown, ChevronUp,
  PlayCircle, FileText, Zap,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type SopStep } from '../lib/api';
import { consumeSopBuilderHandoff } from '../lib/sopHandoff';

// ─── Types ────────────────────────────────────────────────────────────────────

type InputMethod = 'recording' | 'ai-text' | 'template' | 'video' | 'document';
type BuilderStage = 'choose' | 'input' | 'generating' | 'review';

interface EditableStep extends SopStep {
  id: string;
  editing: boolean;
  expanded: boolean;
}

interface SopDraft {
  title: string;
  description: string;
  method: InputMethod;
  status: 'draft' | 'published';
  steps: SopStep[];
}

const SOP_DRAFT_KEY = 'avantika:sop-builder:draft:v1';

// ─── Constants ────────────────────────────────────────────────────────────────

const INPUT_METHODS: { id: InputMethod; icon: typeof Type; label: string; tagline: string; accent: string }[] = [
  { id: 'ai-text',   icon: Sparkles,       label: 'Generate with AI',    tagline: 'Describe your process — AI writes the SOP',       accent: '#8b5cf6' },
  { id: 'recording', icon: Video,          label: 'Record Workflow',      tagline: 'Click through your process and we capture it',    accent: '#3b82f6' },
  { id: 'template',  icon: LayoutTemplate, label: 'Start from Template',  tagline: 'Pick a proven SOP template and customise it',     accent: '#10b981' },
  { id: 'video',     icon: Youtube,        label: 'Import Video',         tagline: 'Paste a YouTube link or upload an MP4',           accent: '#ef4444' },
  { id: 'document',  icon: FileUp,         label: 'Upload Document',      tagline: 'PDF or DOCX — we extract steps automatically',   accent: '#f59e0b' },
];

const TEMPLATES: { label: string; description: string; prompt: string }[] = [
  { label: 'Employee Onboarding',     description: 'End-to-end guide for bringing a new hire up to speed',       prompt: 'How to onboard a new employee' },
  { label: 'Invoice Processing',      description: 'Standard AP workflow from receipt to payment',                prompt: 'Invoice processing and payment approval workflow' },
  { label: 'IT System Setup',         description: 'Provision and configure a new workstation',                  prompt: 'IT laptop setup and system provisioning' },
  { label: 'Customer Support Ticket', description: 'Handle, escalate and resolve customer issues consistently',   prompt: 'Customer support ticket resolution process' },
  { label: 'Software Deployment',     description: 'CI/CD-safe release checklist from PR to production',         prompt: 'Software deployment and release process' },
  { label: 'Expense Reporting',       description: 'Submit, approve and reimburse expenses per policy',          prompt: 'Expense report submission and approval' },
  { label: 'Sales Lead Qualification', description: 'BANT-based lead routing and CRM entry flow',               prompt: 'Sales lead qualification and CRM update process' },
  { label: 'Employee Training',       description: 'Design, deliver and assess a training programme',            prompt: 'Employee training program design and delivery' },
];

const ACTION_COLORS: Record<string, string> = {
  planning:      '#8b5cf6',
  setup:         '#3b82f6',
  action:        '#10b981',
  'data-entry':  '#f59e0b',
  verification:  '#06b6d4',
  approval:      '#ec4899',
  documentation: '#6366f1',
  communication: '#14b8a6',
  payment:       '#22c55e',
  security:      '#ef4444',
  deployment:    '#f97316',
  testing:       '#a855f7',
  monitoring:    '#64748b',
  review:        '#84cc16',
  default:       '#60a5fa',
};

const actionColor = (t?: string) => ACTION_COLORS[t ?? ''] ?? ACTION_COLORS.default;

// ─── Sub-components ───────────────────────────────────────────────────────────

const StepCard: React.FC<{
  step: EditableStep;
  index: number;
  onToggleExpand: () => void;
  onEdit: (field: 'title' | 'description', val: string) => void;
  onDelete: () => void;
}> = ({ step, index, onToggleExpand, onEdit, onDelete }) => {
  const color = actionColor(step.action_type);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-shrink-0 cursor-grab text-white/20">
          <GripVertical size={14} />
        </div>
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
          style={{ background: `${color}22`, color }}
        >
          {index + 1}
        </div>
        {step.editing ? (
          <input
            autoFocus
            className="flex-1 bg-transparent text-white text-sm font-semibold outline-none border-b border-white/20 pb-0.5"
            defaultValue={step.title}
            onBlur={(e) => onEdit('title', e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          />
        ) : (
          <span className="flex-1 text-sm font-semibold text-white leading-snug">{step.title}</span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          <div
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ background: `${color}18`, color }}
          >
            {step.action_type ?? 'action'}
          </div>
          <button
            onClick={onToggleExpand}
            className="p-1 rounded-lg text-white/40 hover:text-white/80 transition-colors"
          >
            {step.expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded-lg text-white/20 hover:text-red-400 transition-colors"
          >
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
            <div className="px-4 pb-4">
              <div
                className="rounded-lg p-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-start gap-2 mb-1">
                  <Pencil size={11} className="text-white/30 mt-0.5 flex-shrink-0" />
                  <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Description</span>
                </div>
                <textarea
                  className="w-full bg-transparent text-xs text-white/70 outline-none resize-none leading-relaxed"
                  rows={3}
                  defaultValue={step.description}
                  onBlur={(e) => onEdit('description', e.target.value)}
                  placeholder="Add details, tips, or notes for this step…"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const SOPBuilderPage = () => {
  const navigate = useNavigate();
  const { token: authToken } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [stage, setStage] = useState<BuilderStage>('choose');
  const [method, setMethod] = useState<InputMethod>('ai-text');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<EditableStep[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedGuideId, setSavedGuideId] = useState<string | null>(null);
  const [sopStatus, setSopStatus] = useState<'draft' | 'published'>('draft');

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handoff = consumeSopBuilderHandoff();
    if (handoff && Array.isArray(handoff.steps) && handoff.steps.length > 0) {
      setTitle(handoff.title || 'Generated SOP');
      setDescription(handoff.description || '');
      if (handoff.sourceMethod && INPUT_METHODS.some((m) => m.id === handoff.sourceMethod)) {
        setMethod(handoff.sourceMethod);
      }
      setSteps(toEditable(handoff.steps));
      setStage('review');
      return;
    }

    try {
      const raw = localStorage.getItem(SOP_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SopDraft>;
      if (typeof parsed.title === 'string') setTitle(parsed.title);
      if (typeof parsed.description === 'string') setDescription(parsed.description);
      if (parsed.method && INPUT_METHODS.some((m) => m.id === parsed.method)) setMethod(parsed.method);
      if (parsed.status === 'draft' || parsed.status === 'published') setSopStatus(parsed.status);
      if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
        setSteps(toEditable(parsed.steps));
        setStage('review');
      } else if (typeof parsed.title === 'string' && parsed.title.trim()) {
        setStage('input');
      }
    } catch {
      localStorage.removeItem(SOP_DRAFT_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const draft: SopDraft = {
      title,
      description,
      method,
      status: sopStatus,
      steps: steps.map((s, i) => ({
        title: s.title,
        description: s.description,
        action_type: s.action_type,
        order: i + 1,
      })),
    };

    if (!draft.title.trim() && draft.steps.length === 0 && !draft.description.trim()) {
      localStorage.removeItem(SOP_DRAFT_KEY);
      return;
    }

    localStorage.setItem(SOP_DRAFT_KEY, JSON.stringify(draft));
  }, [title, description, method, sopStatus, steps]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const toEditable = (raw: SopStep[]): EditableStep[] =>
    raw.map((s, i) => ({ ...s, id: `s-${i}-${Date.now()}`, editing: false, expanded: false }));

  const handleGenerate = async () => {
    if (!title.trim()) { setError('Add a title first'); return; }
    setError('');
    setStage('generating');

    try {
      const res = await api.sopGenerateFromText(token!, { title: title.trim(), description: description.trim() });
      setSteps(toEditable(res.steps));
      setStage('review');
    } catch {
      setError('Generation failed — please try again');
      setStage('input');
    }
  };

  const handleSaveAndOpen = async () => {
    if (!token) {
      setError('You must be signed in to save this SOP.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const normalizedTitle = title.trim();
      const normalizedDescription = description.trim();
      const raw = steps
        .map((s, index) => ({
          title: s.title.trim(),
          description: (s.description || '').trim(),
          action_type: s.action_type || 'action',
          order: index + 1,
        }))
        .filter((s) => s.title.length > 0);

      if (!normalizedTitle) {
        setError('Please provide a title before saving.');
        setSaving(false);
        return;
      }

      if (raw.length === 0) {
        setError('Add at least one valid step before saving.');
        setSaving(false);
        return;
      }

      const source = method === 'template'
        ? 'template'
        : method === 'video'
          ? 'video'
          : method === 'document'
            ? 'document'
            : method === 'recording'
              ? 'recording'
              : 'ai-text';

      const res = await api.sopCreate(token, {
        title: normalizedTitle,
        description: normalizedDescription,
        source,
        status: sopStatus,
        steps: raw,
      });
      setSavedGuideId(res.guide.id);
      localStorage.removeItem(SOP_DRAFT_KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, title: 'New step', description: '', action_type: 'action', order: prev.length + 1, editing: true, expanded: true },
    ]);
  };

  const updateStep = (id: string, field: 'title' | 'description', val: string) => {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, [field]: val, editing: false } : s));
  };

  const deleteStep = (id: string) => setSteps((prev) => prev.filter((s) => s.id !== id));
  const toggleExpand = (id: string) => setSteps((prev) => prev.map((s) => s.id === id ? { ...s, expanded: !s.expanded } : s));

  const applyTemplate = (prompt: string, label: string) => {
    setTitle(label);
    setDescription(prompt);
    setMethod('template');
    setStage('input');
  };

  // ─── Render stages ────────────────────────────────────────────────────────

  const renderChoose = () => (
    <motion.div key="choose" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="text-center mb-10">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}
        >
          <Sparkles size={12} /> SOP Creation & Automation
        </div>
        <h1 className="text-4xl font-black text-white mb-3">Turn anything into a reusable guide</h1>
        <p className="text-white/50 text-lg">Choose how you want to create your SOP</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10">
        {INPUT_METHODS.map((m) => {
          const Icon = m.icon;
          const active = method === m.id;
          return (
            <motion.button
              key={m.id}
              onClick={() => { setMethod(m.id); }}
              className="flex flex-col items-start gap-3 p-5 rounded-2xl text-left transition-all"
              style={{
                background: active ? `${m.accent}12` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? `${m.accent}40` : 'rgba(255,255,255,0.08)'}`,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${m.accent}18` }}>
                <Icon size={18} strokeWidth={1.8} style={{ color: m.accent }} />
              </div>
              <div>
                <div className="text-sm font-bold text-white mb-0.5">{m.label}</div>
                <div className="text-xs text-white/50 leading-snug">{m.tagline}</div>
              </div>
              {active && <CheckCircle2 size={14} className="mt-auto self-end" style={{ color: m.accent }} />}
            </motion.button>
          );
        })}
      </div>

      {/* Templates quick-pick */}
      <div className="max-w-4xl mx-auto mb-8">
        <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Popular Templates</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TEMPLATES.slice(0, 8).map((tpl) => (
            <motion.button
              key={tpl.label}
              onClick={() => applyTemplate(tpl.prompt, tpl.label)}
              className="flex items-start gap-2 p-3 rounded-xl text-left text-xs text-white/60 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              whileHover={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <LayoutTemplate size={11} className="flex-shrink-0 mt-0.5 text-emerald-400" />
              {tpl.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <motion.button
          onClick={() => setStage('input')}
          className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 4px 20px rgba(139,92,246,0.35)' }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Continue with {INPUT_METHODS.find((m2) => m2.id === method)?.label} <ArrowRight size={15} />
        </motion.button>
      </div>
    </motion.div>
  );

  const renderInput = () => (
    <motion.div key="input" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
      <button onClick={() => setStage('choose')} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 mb-8 transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      {/* AI Text / Template input */}
      {(method === 'ai-text' || method === 'template') && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.18)' }}>
              <Sparkles size={18} style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Describe your process</h2>
              <p className="text-white/50 text-sm">AI generates structured SOP steps instantly</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">SOP Title *</label>
              <input
                className="w-full rounded-xl px-4 py-3 text-white text-sm font-medium outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                placeholder="e.g. How to onboard a new sales rep"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Additional context (optional)</label>
              <textarea
                className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none resize-none transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                rows={4}
                placeholder="Add any specific details, tools, or requirements…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

          <div className="flex items-center gap-3 mt-6">
            <motion.button
              onClick={handleGenerate}
              disabled={!title.trim()}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
              whileHover={{ scale: title.trim() ? 1.03 : 1 }}
              whileTap={{ scale: 0.97 }}
            >
              <Sparkles size={15} /> Generate SOP
            </motion.button>
            <span className="text-xs text-white/30">~5 steps generated instantly</span>
          </div>
        </div>
      )}

      {/* Recording placeholder */}
      {method === 'recording' && (
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <Video size={32} strokeWidth={1.5} style={{ color: '#60a5fa' }} />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Screen Recording</h2>
          <p className="text-white/50 mb-8">Click through your workflow and we'll capture each step automatically</p>
          <motion.button
            onClick={() => {
              setTitle(title || 'Recorded Workflow');
              navigate('/dashboard?intent=recording');
            }}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold mx-auto"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <PlayCircle size={16} /> Open Recording Studio
          </motion.button>
        </div>
      )}

      {/* Video placeholder */}
      {method === 'video' && (
        <div className="max-w-2xl mx-auto py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.18)' }}>
              <Youtube size={18} style={{ color: '#f87171' }} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Import from Video</h2>
              <p className="text-white/50 text-sm">Paste a YouTube URL or upload an MP4</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">SOP Title *</label>
              <input
                className="w-full rounded-xl px-4 py-3 text-white text-sm font-medium outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                placeholder="What does this video demonstrate?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">YouTube URL</label>
              <input
                className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                placeholder="https://youtube.com/watch?v=..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
          <motion.button
            onClick={handleGenerate}
            disabled={!title.trim()}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold mt-6 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}
            whileHover={{ scale: title.trim() ? 1.03 : 1 }}
          >
            <Zap size={15} /> Extract Steps from Video
          </motion.button>
        </div>
      )}

      {/* Document placeholder */}
      {method === 'document' && (
        <div className="max-w-2xl mx-auto py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.18)' }}>
              <FileText size={18} style={{ color: '#fbbf24' }} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Upload Document</h2>
              <p className="text-white/50 text-sm">We extract structured steps from your PDF or DOCX</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">SOP Title *</label>
              <input
                className="w-full rounded-xl px-4 py-3 text-white text-sm font-medium outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                placeholder="Give this SOP a name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl py-10 flex flex-col items-center gap-3 transition-all"
              style={{ border: '2px dashed rgba(255,255,255,0.15)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
            >
              <FileUp size={28} className="text-white/30" />
              <span className="text-sm text-white/50">Drop PDF or DOCX here, or <span className="text-amber-400">click to browse</span></span>
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" />
          </div>
          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
          <motion.button
            onClick={handleGenerate}
            disabled={!title.trim()}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold mt-6 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
            whileHover={{ scale: title.trim() ? 1.03 : 1 }}
          >
            <Sparkles size={15} /> Extract Steps
          </motion.button>
        </div>
      )}
    </motion.div>
  );

  const renderGenerating = () => (
    <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="mb-8"
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
          <Sparkles size={28} className="text-white" />
        </div>
      </motion.div>
      <h2 className="text-2xl font-black text-white mb-3">Generating your SOP…</h2>
      <p className="text-white/50 mb-8">AI is structuring your workflow into clear, actionable steps</p>
      <div className="space-y-2 text-sm text-white/40 max-w-xs">
        {['Analysing your process description', 'Detecting workflow patterns', 'Structuring steps', 'Adding action types'].map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.4 }}
            className="flex items-center gap-2"
          >
            <Loader2 size={12} className="animate-spin" />
            {label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderReview = () => (
    <motion.div key="review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {savedGuideId ? (
        /* ── Success State ── */
        <div className="max-w-lg mx-auto text-center py-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
          >
            <Rocket size={32} className="text-white" />
          </motion.div>
          <h2 className="text-3xl font-black text-white mb-3">
            {sopStatus === 'published' ? 'SOP Published!' : 'SOP Saved!'}
          </h2>
          <p className="text-white/50 mb-8">
            Your SOP was {sopStatus === 'published' ? 'published' : 'saved as a draft'} and is ready to share.
          </p>
          <div className="flex flex-col gap-3">
            <motion.button
              onClick={() => navigate(`/guides/${savedGuideId}`)}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
              whileHover={{ scale: 1.03 }}
            >
              <ExternalLink size={15} /> Open & Edit SOP
            </motion.button>
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white/70 font-medium hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Back to Dashboard
            </motion.button>
          </div>
        </div>
      ) : (
        /* ── Review & Edit ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Steps List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-white">{title}</h2>
                <p className="text-xs text-white/40">{steps.length} steps generated · Edit freely</p>
              </div>
              <motion.button
                onClick={addStep}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                whileHover={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <Plus size={14} /> Add step
              </motion.button>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {steps.map((step, i) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    index={i}
                    onToggleExpand={() => toggleExpand(step.id)}
                    onEdit={(field, val) => updateStep(step.id, field, val)}
                    onDelete={() => deleteStep(step.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* AI Enhancement panel */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} style={{ color: '#a78bfa' }} />
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">AI Suggestions</span>
              </div>
              <div className="space-y-2">
                {['Simplify language', 'Add missing steps', 'Standardise terminology', 'Add tips per step'].map((s) => (
                  <button key={s} className="w-full text-left text-xs px-3 py-2.5 rounded-lg text-white/60 hover:text-white transition-colors flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Sparkles size={10} className="text-purple-400 flex-shrink-0" /> {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Publish */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-bold text-white mb-3">Save & Share</h3>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setSopStatus('draft')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                  style={{
                    background: sopStatus === 'draft' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
                    color: sopStatus === 'draft' ? '#93c5fd' : 'rgba(255,255,255,0.6)',
                    border: sopStatus === 'draft' ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  Draft
                </button>
                <button
                  onClick={() => setSopStatus('published')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                  style={{
                    background: sopStatus === 'published' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                    color: sopStatus === 'published' ? '#6ee7b7' : 'rgba(255,255,255,0.6)',
                    border: sopStatus === 'published' ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  Publish
                </button>
              </div>
              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
              <motion.button
                onClick={handleSaveAndOpen}
                disabled={saving || steps.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm mb-3 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
                whileHover={{ scale: saving ? 1 : 1.02 }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
                {saving ? 'Saving…' : sopStatus === 'published' ? 'Publish SOP' : 'Save SOP'}
              </motion.button>
              <button
                onClick={() => {
                  setStage('input');
                  setSteps([]);
                  setSavedGuideId(null);
                  localStorage.removeItem(SOP_DRAFT_KEY);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white/50 hover:text-white text-sm transition-colors"
              >
                <Share2 size={13} /> Start over
              </button>
            </div>

            {/* Stats */}
            <div className="rounded-2xl p-4 grid grid-cols-2 gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-center">
                <div className="text-2xl font-black text-white">{steps.length}</div>
                <div className="text-[10px] text-white/40">Steps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-white">{new Set(steps.map((s) => s.action_type)).size}</div>
                <div className="text-[10px] text-white/40">Action types</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  const STAGE_LABELS: Record<BuilderStage, string> = {
    choose: 'Choose method',
    input: 'Describe process',
    generating: 'Generating',
    review: 'Review & publish',
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {(['choose', 'input', 'generating', 'review'] as BuilderStage[]).map((s, i) => {
            const stages: BuilderStage[] = ['choose', 'input', 'generating', 'review'];
            const currentIdx = stages.indexOf(stage);
            const isActive = s === stage;
            const isDone = stages.indexOf(s) < currentIdx;
            return (
              <div key={s} className="flex items-center gap-2 flex-shrink-0">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: isActive ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : isDone ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
                    color: isActive ? 'white' : isDone ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {isDone && <CheckCircle2 size={10} />}
                  {STAGE_LABELS[s]}
                </div>
                {i < 3 && <div className="w-6 h-px" style={{ background: isDone ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)' }} />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {stage === 'choose' && renderChoose()}
          {stage === 'input' && renderInput()}
          {stage === 'generating' && renderGenerating()}
          {stage === 'review' && renderReview()}
        </AnimatePresence>
      </div>
    </AppShell>
  );
};
