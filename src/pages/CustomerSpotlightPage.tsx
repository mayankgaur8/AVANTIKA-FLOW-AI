import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { useSalesInquiry } from '../context/SalesInquiryContext';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type CustomerSpotlight, type CustomerSpotlightDetail } from '../lib/api';
import { setPostAuthRedirect } from '../lib/postAuthRedirect';
import { setSopBuilderHandoff } from '../lib/sopHandoff';

export const CustomerSpotlightPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openSales } = useSalesInquiry();
  const { token: authToken } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [spotlights, setSpotlights] = useState<CustomerSpotlight[]>([]);
  const [selected, setSelected] = useState<CustomerSpotlight | null>(null);
  const [detail, setDetail] = useState<CustomerSpotlightDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ensureAuth = () => {
    if (token) return true;
    setPostAuthRedirect('/customers/spotlight');
    navigate('/signin', { state: { redirectTo: '/customers/spotlight', sourcePage: location.pathname } });
    return false;
  };

  useEffect(() => {
    api.discoverSpotlight()
      .then((res) => {
        setSpotlights(res.spotlights);
        setSelected(res.featured || res.spotlights[0] || null);
      })
      .catch(() => {
        setSpotlights([]);
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.discoverSpotlightById(selected.id)
      .then((res) => setDetail(res.spotlight))
      .catch(() => setDetail(null));
  }, [selected]);

  const useWorkflow = async () => {
    if (!detail?.caseStudy) return;
    if (!ensureAuth()) return;
    setLoading(true);
    setError('');
    try {
      const wf = await api.discoverWorkflowById(detail.caseStudy.workflow_id);
      setSopBuilderHandoff({
        title: `${detail.company_name} inspired workflow`,
        description: detail.caseStudy.solution,
        sourceMethod: 'template',
        steps: wf.workflow.steps,
        aiInsights: [detail.ai_summary],
      });
      navigate('/workflow-ai/sop-builder');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load workflow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c1b]">
      <Navigation />

      <section className="max-w-6xl mx-auto px-6 pt-12 pb-6">
        <p className="text-xs text-blue-300 font-semibold tracking-[0.18em]">CUSTOMER SPOTLIGHT</p>
        <h1 className="text-4xl font-black text-white mt-2">Proven Success Stories</h1>
        <p className="text-white/60 mt-2">Premium social proof showcasing measurable business outcomes.</p>

        <div className="mt-4 flex gap-2 text-sm">
          <Link to="/discover/case-studies" className="px-3 py-2 rounded-lg text-white/70" style={{ background: 'rgba(255,255,255,0.08)' }}>Case Studies</Link>
          <Link to="/discover/reviews" className="px-3 py-2 rounded-lg text-white/70" style={{ background: 'rgba(255,255,255,0.08)' }}>Reviews</Link>
          <Link to="/customers/spotlight" className="px-3 py-2 rounded-lg text-blue-300" style={{ background: 'rgba(59,130,246,0.2)' }}>Spotlight</Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {spotlights.map((sp) => (
            <button key={sp.id} onClick={() => setSelected(sp)} className="w-full text-left rounded-2xl p-4" style={{ background: selected?.id === sp.id ? 'rgba(59,130,246,0.16)' : 'rgba(255,255,255,0.05)', border: `1px solid ${selected?.id === sp.id ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.1)'}` }}>
              <p className="text-sm font-semibold text-white">{sp.company_name}</p>
              <p className="text-xs text-white/70 mt-1">{sp.highlight}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: 'linear-gradient(140deg, rgba(59,130,246,0.18), rgba(124,58,237,0.12))', border: '1px solid rgba(59,130,246,0.35)' }}>
          {!detail ? <p className="text-white/60">Select a spotlight to view details.</p> : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-white">{detail.company_name}</h2>
                <span className="text-[11px] uppercase tracking-wider text-blue-200">Featured customer</span>
              </div>

              <p className="text-lg text-white/88 mt-3 italic">"{detail.testimonial}"</p>
              <p className="text-sm text-white/70 mt-2">{detail.ai_summary}</p>

              <div className="mt-5 grid sm:grid-cols-3 gap-2">
                <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.18)' }}><p className="text-xs text-white/70">Time saved</p><p className="text-xl font-bold text-white">{detail.metrics.time_saved}</p></div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(14,165,233,0.18)' }}><p className="text-xs text-white/70">Efficiency</p><p className="text-xl font-bold text-white">{detail.metrics.efficiency_improvement}</p></div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(168,85,247,0.18)' }}><p className="text-xs text-white/70">Cost reduction</p><p className="text-xl font-bold text-white">{detail.metrics.cost_reduction}</p></div>
              </div>

              {detail.caseStudy ? (
                <div className="mt-5 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider">Problem → Solution → Outcome</p>
                  <p className="text-sm text-white/75 mt-1">{detail.caseStudy.problem}</p>
                  <p className="text-sm text-white/85 mt-2">{detail.caseStudy.solution}</p>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={detail.caseStudy ? `/discover/case-studies` : '/discover/case-studies'} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                  Read case study
                </Link>
                <button onClick={useWorkflow} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-semibold text-white/85 border border-white/20">
                  Use this workflow
                </button>
                <button onClick={() => openSales({ sourcePage: location.pathname, ctaClicked: 'spotlight_talk_to_sales', interestArea: 'Customer Spotlight' })} className="px-4 py-2 rounded-xl text-sm font-semibold text-white/90" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  Talk to sales
                </button>
              </div>

              <button onClick={useWorkflow} disabled={loading} className="mt-4 inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 text-sm">
                <Sparkles size={14} /> Recommend similar workflow <ArrowRight size={13} />
              </button>

              {error ? <p className="text-red-300 text-xs mt-3">{error}</p> : null}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};
