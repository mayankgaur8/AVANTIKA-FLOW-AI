import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { ProductHero } from '../components/ProductHero';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type PlatformWorkflow, type SopStep } from '../lib/api';
import { setPostAuthRedirect } from '../lib/postAuthRedirect';
import { setSopBuilderHandoff } from '../lib/sopHandoff';

export const OptimizePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token: authToken } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [workflows, setWorkflows] = useState<PlatformWorkflow[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState('');
  const [importedWorkflow, setImportedWorkflow] = useState('');
  const [goal, setGoal] = useState('Reduce cycle time and eliminate redundant approvals');
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState<string[]>([]);
  const [bottlenecks, setBottlenecks] = useState<string[]>([]);
  const [optimizedSteps, setOptimizedSteps] = useState<SopStep[]>([]);
  const [optimizedTitle, setOptimizedTitle] = useState('');

  const ensureAuth = () => {
    if (token) return true;
    setPostAuthRedirect('/product/optimize');
    navigate('/signin', { state: { redirectTo: '/product/optimize', sourcePage: location.pathname } });
    return false;
  };

  useEffect(() => {
    if (!token) return;
    api.platformOptimizeWorkflows(token)
      .then((res) => setWorkflows(res.workflows))
      .catch(() => {
        setWorkflows([]);
      });
  }, [token]);

  const runOptimization = async () => {
    if (!ensureAuth()) return;
    setOptimizing(true);
    setError('');
    try {
      const res = await api.platformOptimizeAnalyze(token!, {
        guideId: selectedGuideId || undefined,
        importedWorkflow: importedWorkflow.trim(),
        goal: goal.trim(),
      });
      setInsights(res.aiInsights);
      setBottlenecks(res.bottlenecks);
      setOptimizedSteps(res.optimizedSteps);
      setOptimizedTitle(res.suggestedVersionName || `${res.title} - Optimized`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  const applyImprovements = () => {
    if (optimizedSteps.length === 0) return;
    setSopBuilderHandoff({
      title: optimizedTitle || 'Optimized Workflow',
      description: goal,
      sourceMethod: 'ai-text',
      steps: optimizedSteps,
      aiInsights: insights,
    });
    navigate('/workflow-ai/sop-builder');
  };

  return (
    <div className="min-h-screen bg-[#070c1b]">
      <Navigation />
      <ProductHero
        dark
        badge="Optimize"
        title="Discover and improve workflows with AI"
        subtitle="Analyze SOP performance, detect bottlenecks, and generate optimized workflow versions you can publish instantly."
        primaryCta={
          <button
            onClick={runOptimization}
            className="px-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-violet-600"
          >
            {optimizing ? 'Analyzing...' : 'Run AI optimization'}
          </button>
        }
        secondaryCta={<button onClick={() => navigate('/platform/agents')} className="px-6 py-3 rounded-xl border border-white/20 text-white/85">Open optimize agents</button>}
        rightVisual={
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-7 shadow-2xl">
            <div className="flex gap-2 mb-4 flex-wrap">
              {['Bottleneck detection', 'Step reduction', 'Clarity optimization', 'Version compare'].map((tab) => <span key={tab} className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/80">{tab}</span>)}
            </div>
            <div className="h-56 rounded-2xl bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-pink-500/20 border border-white/10" />
          </div>
        }
      />

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs tracking-[0.18em] text-blue-300 font-semibold">STEP 1: SELECT WORKFLOW</p>
            <select value={selectedGuideId} onChange={(e) => setSelectedGuideId(e.target.value)} className="mt-3 w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <option value="">Choose existing SOP</option>
              {workflows.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
            <textarea
              value={importedWorkflow}
              onChange={(e) => setImportedWorkflow(e.target.value)}
              rows={4}
              className="mt-3 w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              placeholder="Or paste imported workflow lines here"
            />

            <p className="mt-4 text-xs tracking-[0.18em] text-blue-300 font-semibold">STEP 2: DEFINE GOAL</p>
            <input value={goal} onChange={(e) => setGoal(e.target.value)} className="mt-2 w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />

            <button onClick={runOptimization} disabled={optimizing} className="mt-4 px-5 py-2.5 rounded-xl text-white font-semibold" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
              {optimizing ? 'Running AI analysis...' : 'Analyze with AI'}
            </button>
            {error ? <p className="text-red-300 text-xs mt-3">{error}</p> : null}
          </div>

          <div className="rounded-2xl p-6" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.24)' }}>
            <div className="flex items-center gap-2"><Sparkles size={14} className="text-emerald-300" /><p className="text-xs tracking-[0.18em] text-emerald-300 font-semibold">STEP 3: AI SUGGESTIONS</p></div>
            <div className="mt-3 space-y-1.5">
              {bottlenecks.length === 0 ? <p className="text-sm text-white/50">Run analysis to see bottlenecks and improvements.</p> : bottlenecks.map((b) => <p key={b} className="text-sm text-white/80">• {b}</p>)}
            </div>

            {insights.length > 0 ? (
              <>
                <p className="mt-4 text-xs tracking-[0.18em] text-emerald-300 font-semibold">STEP 4: APPLY IMPROVEMENTS</p>
                <div className="mt-2 space-y-1.5">
                  {insights.map((i) => <p key={i} className="text-xs text-white/70">• {i}</p>)}
                </div>
                <button onClick={applyImprovements} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold" style={{ background: 'linear-gradient(135deg,#10b981,#0ea5e9)' }}>
                  Open optimized workflow <ArrowRight size={14} />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};
