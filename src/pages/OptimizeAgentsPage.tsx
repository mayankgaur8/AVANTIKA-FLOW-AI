import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { ProductHero } from '../components/ProductHero';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type PlatformAgentMetrics, type PlatformAgentRecommendation, type PlatformWorkflow } from '../lib/api';
import { setPostAuthRedirect } from '../lib/postAuthRedirect';
import { setSopBuilderHandoff } from '../lib/sopHandoff';

export const OptimizeAgentsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token: authToken } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [workflows, setWorkflows] = useState<PlatformWorkflow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [autoFix, setAutoFix] = useState(false);
  const [metrics, setMetrics] = useState<PlatformAgentMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<PlatformAgentRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ensureAuth = () => {
    if (token) return true;
    setPostAuthRedirect('/platform/agents');
    navigate('/signin', { state: { redirectTo: '/platform/agents', sourcePage: location.pathname } });
    return false;
  };

  const loadWorkspaceData = async () => {
    if (!token) return;
    try {
      const [wf, status] = await Promise.all([
        api.platformOptimizeWorkflows(token),
        api.platformAgentsStatus(token),
      ]);
      setWorkflows(wf.workflows);
      setMetrics(status.metrics);
      if (status.config?.guideIds?.length) setSelectedIds(status.config.guideIds);
      if (typeof status.config?.autoFix === 'boolean') setAutoFix(status.config.autoFix);
    } catch {
      setWorkflows([]);
      setMetrics(null);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [token]);

  const toggleWorkflow = (guideId: string) => {
    setSelectedIds((prev) => (prev.includes(guideId) ? prev.filter((id) => id !== guideId) : [...prev, guideId]));
  };

  const activateAgents = async () => {
    if (!ensureAuth()) return;
    if (selectedIds.length === 0) {
      setError('Select at least one workflow to monitor');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.platformAgentsActivate(token!, { guideIds: selectedIds, autoFix });
      const status = await api.platformAgentsStatus(token!);
      setMetrics(status.metrics);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to activate agents');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    if (!ensureAuth()) return;
    if (selectedIds.length === 0) {
      setError('Select workflows first to generate recommendations');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.platformAgentRecommendations(token!, selectedIds);
      setRecommendations(res.recommendations);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const applyFix = async (rec: PlatformAgentRecommendation) => {
    if (!ensureAuth()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.platformAgentApplyFix(token!, { recommendationId: rec.id, guideId: rec.guideId });
      setSopBuilderHandoff({
        title: res.title,
        description: `${rec.issue}. ${rec.impact}`,
        sourceMethod: 'ai-text',
        steps: res.steps,
        aiInsights: res.aiInsights,
      });
      navigate('/workflow-ai/sop-builder');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to apply fix');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c1b]">
      <Navigation />
      <ProductHero
        dark
        badge="Optimize Agents"
        title="AI agents that find and fix workflow inefficiencies"
        subtitle="Activate autonomous monitoring, detect process friction, and apply optimized fixes directly into your workflow builder."
        primaryCta={
          <button
            onClick={activateAgents}
            className="px-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-violet-600"
          >
            {loading ? 'Activating...' : 'Activate agents'}
          </button>
        }
        secondaryCta={
          <button onClick={generateRecommendations} className="px-6 py-3 rounded-xl border border-white/20 text-white/85">
            Generate recommendations
          </button>
        }
        rightVisual={
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
            <div className="rounded-2xl border border-violet-300/20 bg-violet-500/10 p-4 text-white/85 text-sm">Autonomous monitoring tracks execution quality and bottlenecks continuously.</div>
            <div className="mt-3 rounded-2xl border border-blue-300/20 bg-blue-500/10 p-4 text-white/85 text-sm">Optional auto-fix applies validated improvements and alerts teams in real time.</div>
          </div>
        }
      />

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs tracking-[0.18em] text-blue-300 font-semibold">STEP 1: SELECT WORKFLOWS TO MONITOR</p>
            <div className="mt-3 space-y-2 max-h-64 overflow-auto pr-1">
              {workflows.map((wf) => (
                <button key={wf.id} onClick={() => toggleWorkflow(wf.id)} className="w-full text-left rounded-lg px-3 py-2 text-sm" style={{ background: selectedIds.includes(wf.id) ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.06)', border: `1px solid ${selectedIds.includes(wf.id) ? 'rgba(59,130,246,0.42)' : 'rgba(255,255,255,0.12)'}`, color: 'rgba(255,255,255,0.82)' }}>
                  {wf.title}
                </button>
              ))}
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm text-white/75 cursor-pointer">
              <input type="checkbox" checked={autoFix} onChange={(e) => setAutoFix(e.target.checked)} />
              Enable auto-fix mode
            </label>
          </div>

          <div className="rounded-2xl p-6" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.24)' }}>
            <p className="text-xs tracking-[0.18em] text-emerald-300 font-semibold">STEP 2-4: MONITOR, RECOMMEND, APPLY</p>
            {metrics ? (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/80">
                <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.07)' }}>Monitored: {metrics.monitoredCount}</div>
                <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.07)' }}>Detected: {metrics.inefficienciesDetected}</div>
                <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.07)' }}>Recommendations: {metrics.recommendationsGenerated}</div>
                <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.07)' }}>Auto-fix: {metrics.autoFixEnabled ? 'On' : 'Off'}</div>
              </div>
            ) : <p className="mt-3 text-sm text-white/50">Activate agents to start monitoring metrics.</p>}

            <div className="mt-4 space-y-2 max-h-56 overflow-auto pr-1">
              {recommendations.map((rec) => (
                <div key={rec.id} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-sm text-white font-semibold">{rec.workflowTitle}</p>
                  <p className="text-xs text-white/75 mt-1">{rec.issue}</p>
                  <p className="text-xs text-white/65 mt-1">{rec.suggestedFix}</p>
                  <button onClick={() => applyFix(rec)} className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200">
                    Apply fix <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>

            {error ? <p className="text-red-300 text-xs mt-3">{error}</p> : null}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};
