import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Copy, Sparkles, ArrowRight } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type ActionExample } from '../lib/api';
import { setPostAuthRedirect } from '../lib/postAuthRedirect';
import { setSopBuilderHandoff } from '../lib/sopHandoff';

export const WorkflowExamplesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token: authToken, user } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [examples, setExamples] = useState<ActionExample[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selected, setSelected] = useState<ActionExample | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ensureAuth = () => {
    if (token) return true;
    setPostAuthRedirect(location.pathname);
    navigate('/signin', { state: { redirectTo: location.pathname } });
    return false;
  };

  useEffect(() => {
    if (!ensureAuth()) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const role = String((user as { role?: string } | null)?.role || '');
        const res = await api.actionExamples(token!, role);
        if (cancelled) return;
        setExamples(res.examples);
        setRecommendedIds(res.recommendedExampleIds);
        setSelected(res.examples[0] || null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load examples');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => ['All', ...Array.from(new Set(examples.map((e) => e.category)))], [examples]);
  const filtered = useMemo(() => activeCategory === 'All' ? examples : examples.filter((e) => e.category === activeCategory), [examples, activeCategory]);

  const openInBuilder = (example: ActionExample, title?: string) => {
    setSopBuilderHandoff({
      title: title || example.title,
      description: example.description,
      sourceMethod: 'template',
      steps: example.steps,
      aiInsights: example.aiInsights,
    });
    navigate('/workflow-ai/sop-builder');
  };

  const customizeWithAi = async () => {
    if (!token || !selected || !customPrompt.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.actionCustomizeExample(token, selected.id, customPrompt.trim());
      setSopBuilderHandoff({ title: res.title, description: selected.description, sourceMethod: 'template', steps: res.steps, aiInsights: res.aiInsights });
      navigate('/workflow-ai/sop-builder');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to customize example');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-white">View Examples</h1>
        <p className="text-white/55 mt-2">Explore proven workflows, preview step-by-step guidance, and launch directly into editing.</p>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((c) => (
                <button key={c} onClick={() => setActiveCategory(c)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: activeCategory === c ? 'rgba(59,130,246,0.22)' : 'rgba(255,255,255,0.06)', color: activeCategory === c ? '#93c5fd' : 'rgba(255,255,255,0.7)' }}>{c}</button>
              ))}
            </div>

            {loading && examples.length === 0 ? <p className="text-white/50 text-sm">Loading examples...</p> : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((ex) => (
                <motion.button
                  key={ex.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelected(ex)}
                  className="text-left rounded-xl p-4"
                  style={{ background: selected?.id === ex.id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selected?.id === ex.id ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.08)'}` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-white/45">{ex.category}</span>
                    {recommendedIds.includes(ex.id) ? <span className="text-[10px] text-emerald-300">Recommended</span> : null}
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{ex.title}</h3>
                  <p className="text-white/55 text-xs leading-relaxed">{ex.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {!selected ? <p className="text-white/45 text-sm">Select an example to preview</p> : (
                <>
                  <h3 className="text-white font-bold text-sm">{selected.title}</h3>
                  <p className="text-white/55 text-xs mt-1">{selected.description}</p>
                  <div className="mt-3 space-y-2 max-h-44 overflow-auto pr-1">
                    {selected.steps.map((s, i) => (
                      <div key={`${selected.id}-${i}`} className="rounded-lg px-2 py-1.5 text-xs text-white/70" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        {i + 1}. {s.title}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 space-y-2">
                    <button onClick={() => openInBuilder(selected)} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                      <BookOpen size={12} /> Use this template
                    </button>
                    <button onClick={() => openInBuilder({ ...selected, title: `${selected.title} (Duplicate)` }, `${selected.title} (Duplicate)`)} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white/85" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <Copy size={12} /> Duplicate & edit
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)' }}>
              <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">Customize with AI</p>
              <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={3} placeholder="Customize for our enterprise support onboarding flow..." className="w-full rounded-lg px-3 py-2 text-xs text-white outline-none resize-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
              <button onClick={customizeWithAi} disabled={!selected || !customPrompt.trim() || loading} className="mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#10b981,#0ea5e9)' }}>
                <Sparkles size={12} /> {loading ? 'Customizing...' : 'Customize with AI'}
              </button>
              {error ? <p className="text-red-300 text-[11px] mt-2">{error}</p> : null}
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/workflow-ai/templates')} className="mt-6 text-sm text-white/55 hover:text-white inline-flex items-center gap-1">
          Go to AI Templates <ArrowRight size={14} />
        </button>
      </div>
    </AppShell>
  );
};
