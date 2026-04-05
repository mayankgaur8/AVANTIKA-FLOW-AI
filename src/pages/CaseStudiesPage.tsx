import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type CaseStudy, type CaseStudyDetail } from '../lib/api';
import { setPostAuthRedirect } from '../lib/postAuthRedirect';
import { setSopBuilderHandoff } from '../lib/sopHandoff';

export const CaseStudiesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token: authToken, user } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<CaseStudy | null>(null);
  const [detail, setDetail] = useState<CaseStudyDetail | null>(null);
  const [similarPrompt, setSimilarPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ensureAuth = () => {
    if (token) return true;
    setPostAuthRedirect('/discover/case-studies');
    navigate('/signin', { state: { redirectTo: '/discover/case-studies', sourcePage: location.pathname } });
    return false;
  };

  useEffect(() => {
    const role = String((user as { role?: string } | null)?.role || '');
    api.discoverCaseStudies(role)
      .then((res) => {
        setCaseStudies(res.caseStudies);
        setRecommendedIds(res.recommendedCaseStudyIds);
        if (res.caseStudies[0]) setSelected(res.caseStudies[0]);
      })
      .catch(() => {
        setCaseStudies([]);
      });
  }, [user]);

  useEffect(() => {
    if (!selected) return;
    api.discoverCaseStudyById(selected.id)
      .then((res) => {
        setDetail(res.caseStudy);
      })
      .catch(() => {
        setDetail(null);
      });
  }, [selected]);

  const sorted = useMemo(() => {
    return [...caseStudies].sort((a, b) => {
      const aR = recommendedIds.includes(a.id) ? 1 : 0;
      const bR = recommendedIds.includes(b.id) ? 1 : 0;
      return bR - aR;
    });
  }, [caseStudies, recommendedIds]);

  const useWorkflow = async () => {
    if (!detail) return;
    setLoading(true);
    setError('');
    try {
      const wf = await api.discoverWorkflowById(detail.workflow_id);
      setSopBuilderHandoff({
        title: wf.workflow.title,
        description: detail.solution,
        sourceMethod: 'template',
        steps: wf.workflow.steps,
        aiInsights: [
          'Loaded workflow from proven case study implementation',
          `Outcome target: ${detail.result_metrics.efficiency_improvement}`,
        ],
      });
      navigate('/workflow-ai/sop-builder');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const generateSimilar = async () => {
    if (!detail) return;
    if (!ensureAuth()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.discoverGenerateSimilar(token!, detail.id, similarPrompt);
      setSopBuilderHandoff({
        title: res.title,
        description: detail.solution,
        sourceMethod: 'ai-text',
        steps: res.steps,
        aiInsights: res.aiInsights,
      });
      navigate('/workflow-ai/sop-builder');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to generate similar solution');
    } finally {
      setLoading(false);
    }
  };

  const viewWorkflow = async () => {
    if (!detail) return;
    setLoading(true);
    setError('');
    try {
      const wf = await api.discoverWorkflowById(detail.workflow_id);
      setSopBuilderHandoff({
        title: `${detail.company_name} Workflow Used`,
        description: detail.problem,
        sourceMethod: 'template',
        steps: wf.workflow.steps,
        aiInsights: [detail.ai_summary],
      });
      navigate('/workflow-ai/sop-builder');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to open workflow used');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c1b]">
      <Navigation />
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-6">
        <p className="text-xs text-blue-300 font-semibold tracking-[0.18em]">DISCOVER</p>
        <h1 className="text-4xl font-black text-white mt-2">Case Studies</h1>
        <p className="text-white/60 mt-2">See how teams are transforming workflows with AI.</p>

        <div className="mt-4 flex gap-2 text-sm">
          <Link to="/discover/case-studies" className="px-3 py-2 rounded-lg text-blue-300" style={{ background: 'rgba(59,130,246,0.2)' }}>Case Studies</Link>
          <Link to="/discover/reviews" className="px-3 py-2 rounded-lg text-white/70" style={{ background: 'rgba(255,255,255,0.08)' }}>Reviews</Link>
          <Link to="/customers/spotlight" className="px-3 py-2 rounded-lg text-white/70" style={{ background: 'rgba(255,255,255,0.08)' }}>Customer Spotlight</Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs text-white/45 uppercase tracking-wider mb-3">Role-based recommendations</p>
          <div className="space-y-2 max-h-[560px] overflow-auto pr-1">
            {sorted.map((cs) => {
              const active = selected?.id === cs.id;
              return (
                <button key={cs.id} onClick={() => setSelected(cs)} className="w-full text-left rounded-xl p-3" style={{ background: active ? 'rgba(59,130,246,0.16)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.1)'}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-white font-semibold">{cs.company_name}</p>
                    {recommendedIds.includes(cs.id) ? <span className="text-[10px] text-emerald-300">Recommended</span> : null}
                  </div>
                  <p className="text-xs text-white/60">{cs.industry}</p>
                  <p className="text-xs text-white/70 mt-1">{cs.problem}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.22)' }}>
          {!detail ? <p className="text-white/55">Select a case study to view details.</p> : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{detail.company_name}</h2>
                <span className="text-xs text-blue-300">{detail.industry}</span>
              </div>

              <p className="text-sm text-white/70 mt-2">{detail.ai_summary}</p>

              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-[11px] text-white/45 uppercase tracking-wider">Before</p>
                  <p className="text-sm text-white/78 mt-1">{detail.before_after.before}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-[11px] text-white/45 uppercase tracking-wider">After</p>
                  <p className="text-sm text-white/78 mt-1">{detail.before_after.after}</p>
                </div>
              </div>

              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="rounded-lg p-2 text-xs text-white/85" style={{ background: 'rgba(16,185,129,0.18)' }}>Time saved: {detail.result_metrics.time_saved}</div>
                <div className="rounded-lg p-2 text-xs text-white/85" style={{ background: 'rgba(14,165,233,0.18)' }}>Efficiency: {detail.result_metrics.efficiency_improvement}</div>
                <div className="rounded-lg p-2 text-xs text-white/85" style={{ background: 'rgba(168,85,247,0.18)' }}>Cost: {detail.result_metrics.cost_reduction}</div>
                <div className="rounded-lg p-2 text-xs text-white/85" style={{ background: 'rgba(245,158,11,0.18)' }}>ROI: {detail.result_metrics.roi_impact}</div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={viewWorkflow} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>View workflow used</button>
                <button onClick={useWorkflow} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-semibold text-white/85 border border-white/20">Use this workflow</button>
              </div>

              <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-2"><Sparkles size={14} className="text-emerald-300" /><p className="text-xs text-emerald-300 uppercase tracking-wider">Generate similar solution</p></div>
                <textarea value={similarPrompt} onChange={(e) => setSimilarPrompt(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} placeholder="Generate a similar workflow for our AP onboarding and compliance setup" />
                <button onClick={generateSimilar} disabled={loading} className="mt-2 inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#10b981,#0ea5e9)' }}>
                  Generate similar solution <ArrowRight size={14} />
                </button>
              </div>

              {error ? <p className="text-red-300 text-xs mt-3">{error}</p> : null}
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};
