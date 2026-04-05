/**
 * WorkflowBuilderPage — shared AI-powered builder for:
 *   /workflow-ai/process-capture  → Process Documentation
 *   /workflow-ai/standardize      → Workflow Standardization
 *   /workflow-ai/training-builder → Internal Training Guides
 *
 * Configured entirely via a `WorkflowBuilderConfig` prop so each entry
 * point is a thin wrapper — no logic duplication.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles, ArrowRight, ArrowLeft, Loader2, CheckCircle2,
  GripVertical, Trash2, Plus, ChevronDown, ChevronUp,
  Rocket, ExternalLink, Brain, Lightbulb, Users,
  BookMarked, GitBranch, FileCheck2, Pencil, AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type WorkflowStep, type WorkflowBuilderType, type WorkflowGuideCard } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkflowBuilderConfig {
  builderType: WorkflowBuilderType;
  label: string;
  tagline: string;
  accent: string;
  secondaryAccent: string;
  icon: LucideIcon;
  inputPlaceholder: string;
  descriptionPlaceholder: string;
  /** Show role-per-step field (standardize / training) */
  showRole: boolean;
  /** Show "required step" toggle (standardize) */
  showRequired: boolean;
  /** Show checkpoint/quiz fields (training) */
  showCheckpoint: boolean;
  /** Show "select existing guides" picker (standardize) */
  showGuidePicker: boolean;
  aiInsights: string[];
  generateLabel: string;
  saveLabel: string;
}

type BuilderStage = 'input' | 'generating' | 'review';

interface EditableStep extends WorkflowStep {
  _id: string;
  expanded: boolean;
}

// ─── ACTION COLOURS ───────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  planning: '#8b5cf6', setup: '#3b82f6', action: '#10b981',
  'data-entry': '#f59e0b', verification: '#06b6d4', approval: '#ec4899',
  documentation: '#6366f1', communication: '#14b8a6', analysis: '#f97316',
  training: '#a855f7', editing: '#84cc16', review: '#64748b',
  decision: '#ef4444', investigation: '#38bdf8', default: '#60a5fa',
};
const actionColor = (t?: string) => ACTION_COLORS[t ?? ''] ?? ACTION_COLORS.default;

// ─── Step Card ────────────────────────────────────────────────────────────────

const StepCard: React.FC<{
  step: EditableStep;
  index: number;
  config: WorkflowBuilderConfig;
  onChange: (id: string, patch: Partial<WorkflowStep>) => void;
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
          {step.has_checkpoint && (
            <div className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>
              quiz
            </div>
          )}
          {step.required && (
            <div className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
              required
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
                {/* Role (standardize / training) */}
                {config.showRole && (
                  <div>
                    <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
                      <Users size={9} className="inline mr-1" />Role
                    </label>
                    <input
                      className="w-full rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      value={step.role ?? ''}
                      onChange={(e) => onChange(step._id, { role: e.target.value })}
                      placeholder="e.g. Manager, HR Rep"
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

              {/* Required toggle (standardize) */}
              {config.showRequired && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className="w-8 h-4 rounded-full transition-all relative"
                    style={{ background: step.required ? '#ef4444' : 'rgba(255,255,255,0.1)' }}
                    onClick={() => onChange(step._id, { required: !step.required })}
                  >
                    <div
                      className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                      style={{ left: step.required ? '18px' : '2px' }}
                    />
                  </div>
                  <span className="text-xs text-white/50">Required step</span>
                </label>
              )}

              {/* Checkpoint (training) */}
              {config.showCheckpoint && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      className="w-8 h-4 rounded-full transition-all relative"
                      style={{ background: step.has_checkpoint ? '#a855f7' : 'rgba(255,255,255,0.1)' }}
                      onClick={() => onChange(step._id, { has_checkpoint: !step.has_checkpoint })}
                    >
                      <div
                        className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                        style={{ left: step.has_checkpoint ? '18px' : '2px' }}
                      />
                    </div>
                    <span className="text-xs text-white/50">Add knowledge check</span>
                  </label>
                  {step.has_checkpoint && (
                    <input
                      className="w-full rounded-lg px-3 py-2 text-xs text-white/70 outline-none"
                      style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}
                      value={step.checkpoint_question ?? ''}
                      onChange={(e) => onChange(step._id, { checkpoint_question: e.target.value })}
                      placeholder="Quiz question for this step…"
                    />
                  )}
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
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>AI Insights</span>
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

// ─── Guide Selector (for Standardize) ────────────────────────────────────────

const GuidePicker: React.FC<{
  guides: WorkflowGuideCard[];
  selected: string[];
  onToggle: (id: string) => void;
  accent: string;
}> = ({ guides, selected, onToggle, accent }) => (
  <div className="space-y-2">
    {guides.length === 0 ? (
      <div className="rounded-xl p-4 text-center" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
        <AlertTriangle size={20} className="text-white/20 mx-auto mb-2" />
        <p className="text-xs text-white/40">No existing guides yet — we'll generate a canonical baseline instead.</p>
      </div>
    ) : (
      guides.map((g) => {
        const active = selected.includes(g.id);
        return (
          <motion.button
            key={g.id}
            onClick={() => onToggle(g.id)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
            style={{
              background: active ? `${accent}10` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? `${accent}35` : 'rgba(255,255,255,0.08)'}`,
            }}
            whileHover={{ scale: 1.01 }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: active ? `${accent}18` : 'rgba(255,255,255,0.06)' }}
            >
              <FileCheck2 size={14} style={{ color: active ? accent : 'rgba(255,255,255,0.3)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white leading-snug truncate">{g.title}</div>
              <div className="text-xs text-white/40">{g.total_steps} steps · {g.status}</div>
            </div>
            {active && <CheckCircle2 size={14} style={{ color: accent }} className="flex-shrink-0" />}
          </motion.button>
        );
      })
    )}
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export const WorkflowBuilderPage: React.FC<{ config: WorkflowBuilderConfig }> = ({ config }) => {
  const navigate = useNavigate();
  const { token: authToken } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [stage, setStage] = useState<BuilderStage>('input');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<EditableStep[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>(config.aiInsights);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedGuideId, setSavedGuideId] = useState<string | null>(null);
  const [selectedGuideIds, setSelectedGuideIds] = useState<string[]>([]);
  const [existingGuides, setExistingGuides] = useState<WorkflowGuideCard[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(false);

  const Icon = config.icon;

  // Load existing guides for standardize picker
  useEffect(() => {
    if (!config.showGuidePicker || !token) return;
    setLoadingGuides(true);
    api.workflowListGuides(token)
      .then((r) => setExistingGuides(r.guides))
      .catch(() => {/* silent */})
      .finally(() => setLoadingGuides(false));
  }, [config.showGuidePicker, token]);

  // ─── Step helpers ──────────────────────────────────────────────────────────

  const toEditable = (raw: WorkflowStep[]): EditableStep[] =>
    raw.map((s, i) => ({ ...s, _id: `s${i}-${Date.now()}`, expanded: false }));

  const changeStep = (id: string, patch: Partial<WorkflowStep>) =>
    setSteps((prev) => prev.map((s) => s._id === id ? { ...s, ...patch } : s));

  const deleteStep = (id: string) =>
    setSteps((prev) => prev.filter((s) => s._id !== id));

  const toggleExpand = (id: string) =>
    setSteps((prev) => prev.map((s) => s._id === id ? { ...s, expanded: !s.expanded } : s));

  const addBlankStep = () =>
    setSteps((prev) => [
      ...prev,
      { _id: `new-${Date.now()}`, title: '', description: '', action_type: 'action', expanded: true, required: false, has_checkpoint: false, tip: '', role: '', checkpoint_question: '' },
    ]);

  // ─── Generate ─────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!title.trim()) { setError('Add a title first'); return; }
    setError('');
    setStage('generating');

    try {
      const res = await api.workflowGenerate(token!, {
        title: title.trim(),
        description: description.trim(),
        builderType: config.builderType,
        existingGuideIds: selectedGuideIds,
      });
      setSteps(toEditable(res.steps));
      setAiInsights(res.aiInsights);
      setStage('review');
    } catch {
      setError('Generation failed — please try again');
      setStage('input');
    }
  };

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!token || steps.length === 0) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        title,
        description,
        source: config.builderType,
        steps: steps.map(({ title: t, description: d, action_type, required, role, tip, has_checkpoint, checkpoint_question, order }) => ({
          title: t, description: d, action_type, required, role, tip, has_checkpoint, checkpoint_question, order,
        })),
      };
      const res = await api.workflowCreate(token, payload);
      setSavedGuideId(res.guide.id);
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Stage: INPUT ──────────────────────────────────────────────────────────

  const renderInput = () => (
    <motion.div key="input" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main form */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${config.accent}18` }}>
              <Icon size={20} strokeWidth={1.8} style={{ color: config.accent }} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{config.label}</h2>
              <p className="text-sm text-white/50">{config.tagline}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Title *</label>
              <input
                className="w-full rounded-xl px-4 py-3 text-white text-sm font-medium outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                placeholder={config.inputPlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = `${config.accent}60`)}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Additional context</label>
              <textarea
                className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none resize-none transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                rows={4}
                placeholder={config.descriptionPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = `${config.accent}60`)}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
              />
            </div>
          </div>

          {/* Guide picker for standardize */}
          {config.showGuidePicker && (
            <div className="mt-6">
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                Select existing guides to compare (optional)
              </label>
              {loadingGuides ? (
                <div className="flex items-center gap-2 text-white/40 text-xs py-4">
                  <Loader2 size={13} className="animate-spin" /> Loading your guides…
                </div>
              ) : (
                <GuidePicker
                  guides={existingGuides}
                  selected={selectedGuideIds}
                  onToggle={(id) => setSelectedGuideIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
                  accent={config.accent}
                />
              )}
            </div>
          )}

          {error && <p className="text-red-400 text-xs mt-4">{error}</p>}

          <div className="flex items-center gap-3 mt-6">
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

        {/* Right: AI hints */}
        <div className="lg:col-span-2 space-y-4">
          <AiInsightsPanel insights={config.aiInsights} accent={config.accent} />
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">What you'll get</p>
            <div className="space-y-2.5">
              {[
                config.showGuidePicker ? 'Canonical standard workflow' : 'Structured step-by-step guide',
                config.showRole ? 'Role assignments per step' : 'Clear action types per step',
                config.showCheckpoint ? 'Knowledge checkpoints & quizzes' : 'AI-written descriptions',
                'Shareable & reusable guide',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-white/50">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: config.accent }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // ─── Stage: GENERATING ────────────────────────────────────────────────────

  const renderGenerating = () => (
    <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="mb-8"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${config.accent}, ${config.secondaryAccent})` }}
        >
          <Sparkles size={28} className="text-white" />
        </div>
      </motion.div>
      <h2 className="text-2xl font-black text-white mb-3">AI is building your guide…</h2>
      <p className="text-white/50 mb-8">{config.tagline}</p>
      <div className="space-y-2 text-sm text-white/40 max-w-xs">
        {['Analysing your description', 'Detecting workflow patterns', 'Structuring steps', 'Adding context and tips'].map((label, i) => (
          <motion.div key={label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }} className="flex items-center gap-2">
            <Loader2 size={12} className="animate-spin" /> {label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  // ─── Stage: REVIEW ────────────────────────────────────────────────────────

  const renderReview = () => (
    <motion.div key="review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {savedGuideId ? (
        /* Success */
        <div className="max-w-lg mx-auto text-center py-16">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: `linear-gradient(135deg, ${config.accent}, ${config.secondaryAccent})` }}
          >
            <Rocket size={32} className="text-white" />
          </motion.div>
          <h2 className="text-3xl font-black text-white mb-3">Guide Saved!</h2>
          <p className="text-white/50 mb-8">Your {config.label.toLowerCase()} is ready to share with your team.</p>
          <div className="flex flex-col gap-3">
            <motion.button
              onClick={() => navigate(`/guides/${savedGuideId}`)}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold"
              style={{ background: `linear-gradient(135deg, ${config.accent}, ${config.secondaryAccent})` }}
              whileHover={{ scale: 1.03 }}
            >
              <ExternalLink size={15} /> Open & Edit Guide
            </motion.button>
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white/60 hover:text-white transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Back to Dashboard
            </motion.button>
          </div>
        </div>
      ) : (
        /* Review & edit */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Steps */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-white leading-snug">{title}</h2>
                <p className="text-xs text-white/40">{steps.length} steps · Review and edit freely</p>
              </div>
              <motion.button
                onClick={addBlankStep}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                whileHover={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <Plus size={13} /> Add step
              </motion.button>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
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
            </div>

            <motion.button
              onClick={addBlankStep}
              className="mt-3 flex items-center gap-2 w-full py-3 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors justify-center"
              style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
              whileHover={{ borderColor: `${config.accent}40` }}
            >
              <Plus size={14} /> Add another step
            </motion.button>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* AI insights */}
            <AiInsightsPanel insights={aiInsights} accent={config.accent} />

            {/* Stats */}
            <div className="rounded-2xl p-4 grid grid-cols-2 gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-center">
                <div className="text-2xl font-black text-white">{steps.length}</div>
                <div className="text-[10px] text-white/40">Steps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-white">
                  {config.showRequired ? steps.filter((s) => s.required).length : new Set(steps.map((s) => s.action_type)).size}
                </div>
                <div className="text-[10px] text-white/40">{config.showRequired ? 'Required' : 'Action types'}</div>
              </div>
              {config.showCheckpoint && (
                <div className="col-span-2 text-center">
                  <div className="text-2xl font-black text-white">{steps.filter((s) => s.has_checkpoint).length}</div>
                  <div className="text-[10px] text-white/40">Knowledge checks</div>
                </div>
              )}
            </div>

            {/* Save */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-bold text-white mb-3">Save & Share</h3>
              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
              <motion.button
                onClick={handleSave}
                disabled={saving || steps.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm mb-2 disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${config.accent}, ${config.secondaryAccent})` }}
                whileHover={{ scale: saving ? 1 : 1.02 }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                {saving ? 'Saving…' : config.saveLabel}
              </motion.button>
              <button
                onClick={() => { setStage('input'); setSteps([]); setSavedGuideId(null); }}
                className="w-full text-center text-xs text-white/40 hover:text-white/60 transition-colors py-1"
              >
                Start over
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  // ─── Stage labels & progress bar ──────────────────────────────────────────

  const STAGES: BuilderStage[] = ['input', 'generating', 'review'];
  const STAGE_LABELS: Record<BuilderStage, string> = { input: 'Describe', generating: 'Generating', review: 'Review & publish' };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/workflow-ai/sop-builder')}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mr-2"
          >
            <ArrowLeft size={14} />
          </button>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: `${config.accent}15`, border: `1px solid ${config.accent}30`, color: config.accent }}
          >
            <Icon size={11} /> {config.label}
          </div>
          {/* Progress */}
          <div className="flex items-center gap-2 ml-2">
            {STAGES.map((s, i) => {
              const idx = STAGES.indexOf(stage);
              const isActive = s === stage;
              const isDone = STAGES.indexOf(s) < idx;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all"
                    style={{
                      background: isActive ? `linear-gradient(135deg, ${config.accent}, ${config.secondaryAccent})` : isDone ? `${config.accent}15` : 'rgba(255,255,255,0.05)',
                      color: isActive ? 'white' : isDone ? config.accent : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {isDone && <CheckCircle2 size={9} />}
                    {STAGE_LABELS[s]}
                  </div>
                  {i < 2 && <div className="w-4 h-px" style={{ background: isDone ? `${config.accent}40` : 'rgba(255,255,255,0.08)' }} />}
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {stage === 'input' && renderInput()}
          {stage === 'generating' && renderGenerating()}
          {stage === 'review' && renderReview()}
        </AnimatePresence>
      </div>
    </AppShell>
  );
};
