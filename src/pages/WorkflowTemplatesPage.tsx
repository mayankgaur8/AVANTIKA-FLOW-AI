import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type ActionTemplateKey } from '../lib/api';
import { setPostAuthRedirect } from '../lib/postAuthRedirect';
import { setSopBuilderHandoff } from '../lib/sopHandoff';

const TEMPLATE_OPTIONS: Array<{ key: ActionTemplateKey; title: string; desc: string }> = [
  { key: 'onboarding', title: 'Create SOP for onboarding process', desc: 'Structured onboarding flow with milestones and check-ins' },
  { key: 'internal-workflow', title: 'Document internal workflow', desc: 'Capture and standardize daily operational processes' },
  { key: 'runbook', title: 'Build operations runbook', desc: 'Incident/ops runbook with response and verification steps' },
  { key: 'training', title: 'Create training guide', desc: 'Learning workflow with checkpoints and completion tracking' },
];

export const WorkflowTemplatesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token: authToken } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [selected, setSelected] = useState<ActionTemplateKey>('onboarding');
  const [prompt, setPrompt] = useState('Employee onboarding for engineers');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const state = location.state as { prompt?: string } | null;
    if (state?.prompt) {
      setPrompt(state.prompt);
    }
  }, [location.state]);

  const ensureAuth = () => {
    if (token) return true;
    setPostAuthRedirect(location.pathname);
    navigate('/signin', { state: { redirectTo: location.pathname } });
    return false;
  };

  const generate = async () => {
    if (!ensureAuth()) return;
    if (!prompt.trim()) { setError('Describe your process first'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.actionTemplateGenerate(token!, { templateKey: selected, prompt: prompt.trim() });
      setSopBuilderHandoff({ title: res.title || prompt, description: prompt, sourceMethod: 'ai-text', steps: res.steps, aiInsights: res.aiInsights });
      navigate('/workflow-ai/sop-builder');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-white">AI Templates</h1>
        <p className="text-white/55 mt-2">Start instantly with AI-generated workflows and open directly in the SOP builder.</p>

        <div className="mt-6 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Template options</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEMPLATE_OPTIONS.map((t) => (
              <button
                key={t.key}
                onClick={() => setSelected(t.key)}
                className="rounded-xl p-3 text-left"
                style={{ background: selected === t.key ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selected === t.key ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'}` }}
              >
                <h3 className="text-sm font-semibold text-white">{t.title}</h3>
                <p className="text-xs text-white/55 mt-1">{t.desc}</p>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Describe your process</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
              placeholder="Employee onboarding for engineers with day 1 setup, week 1 goals, and 30-60-90 milestones"
            />
          </div>

          {error ? <p className="text-red-300 text-xs mt-3">{error}</p> : null}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generate}
            disabled={loading || !prompt.trim()}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}
          >
            <Sparkles size={14} /> {loading ? 'Generating...' : 'Generate with AI'}
          </motion.button>
        </div>

        <button onClick={() => navigate('/workflow-ai/examples')} className="mt-6 text-sm text-white/55 hover:text-white inline-flex items-center gap-1">
          Explore examples first <ArrowRight size={14} />
        </button>
      </div>
    </AppShell>
  );
};
