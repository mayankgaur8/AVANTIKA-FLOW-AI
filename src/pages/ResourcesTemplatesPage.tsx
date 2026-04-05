import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type ResourceTemplate } from '../lib/api';
import { setPostAuthRedirect } from '../lib/postAuthRedirect';
import { setSopBuilderHandoff } from '../lib/sopHandoff';

const CATEGORIES = ['All', 'Operations', 'IT', 'Finance', 'HR', 'Sales'];

export const ResourcesTemplatesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token: authToken, user } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [templates, setTemplates] = useState<ResourceTemplate[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<ResourceTemplate | null>(null);
  const [companyContext, setCompanyContext] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ensureAuth = () => {
    if (token) return true;
    setPostAuthRedirect('/resources/templates');
    navigate('/signin', { state: { redirectTo: '/resources/templates', sourcePage: location.pathname } });
    return false;
  };

  useEffect(() => {
    const role = String((user as { role?: string } | null)?.role || '');
    api.resourcesTemplates({
      category: category === 'All' ? undefined : category,
      query: query.trim() || undefined,
      role,
    })
      .then((res) => {
        setTemplates(res.templates);
        setRecommendedIds(res.recommendedTemplateIds);
        if (!selected && res.templates[0]) setSelected(res.templates[0]);
      })
      .catch(() => {
        setTemplates([]);
      });
  }, [category, query, user]);

  useEffect(() => {
    if (!selected) return;
    api.resourcesImproveTemplate(selected.id)
      .then((res) => setSuggestions(res.suggestions))
      .catch(() => setSuggestions([]));
  }, [selected]);

  const sorted = useMemo(() => {
    return [...templates].sort((a, b) => {
      const aR = recommendedIds.includes(a.id) ? 1 : 0;
      const bR = recommendedIds.includes(b.id) ? 1 : 0;
      return bR - aR;
    });
  }, [templates, recommendedIds]);

  const useTemplate = () => {
    if (!selected) return;
    setSopBuilderHandoff({
      title: selected.name,
      description: selected.description,
      sourceMethod: 'template',
      steps: selected.workflow_steps,
      aiInsights: [
        `Estimated time saved: ${selected.estimated_time_saved}`,
        'Imported from template gallery',
      ],
    });
    navigate('/workflow-ai/sop-builder');
  };

  const customizeTemplate = async () => {
    if (!selected) return;
    if (!ensureAuth()) return;
    if (!companyContext.trim()) {
      setError('Add your company context to customize this template');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.resourcesCustomizeTemplate(token!, selected.id, companyContext.trim());
      setSopBuilderHandoff({
        title: res.title,
        description: selected.description,
        sourceMethod: 'ai-text',
        steps: res.steps,
        aiInsights: res.aiInsights,
      });
      navigate('/workflow-ai/sop-builder');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to customize template');
    } finally {
      setLoading(false);
    }
  };

  const previewWorkflow = () => {
    if (!selected) return;
    setSopBuilderHandoff({
      title: `${selected.name} (Preview)`,
      description: selected.description,
      sourceMethod: 'template',
      steps: selected.workflow_steps,
      aiInsights: ['Preview mode from template gallery'],
    });
    navigate('/workflow-ai/sop-builder');
  };

  return (
    <div className="min-h-screen bg-[#070c1b]">
      <Navigation />

      <section className="max-w-6xl mx-auto px-6 pt-12 pb-6">
        <p className="text-xs text-blue-300 font-semibold tracking-[0.18em]">RESOURCES</p>
        <h1 className="text-4xl font-black text-white mt-2">Template Gallery</h1>
        <p className="text-white/60 mt-2">Start faster with ready-to-use workflows.</p>

        <div className="mt-4 flex gap-2 text-sm flex-wrap">
          <Link to="/resources/templates" className="px-3 py-2 rounded-lg text-blue-300" style={{ background: 'rgba(59,130,246,0.2)' }}>Template Gallery</Link>
          <Link to="/resources/security" className="px-3 py-2 rounded-lg text-white/70" style={{ background: 'rgba(255,255,255,0.08)' }}>Security</Link>
          <Link to="/resources/guides" className="px-3 py-2 rounded-lg text-white/70" style={{ background: 'rgba(255,255,255,0.08)' }}>Latest Guides</Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs text-white/45 uppercase tracking-wider mb-2">Browse templates</p>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates"
            className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: category === c ? 'rgba(59,130,246,0.22)' : 'rgba(255,255,255,0.08)', color: category === c ? '#93c5fd' : 'rgba(255,255,255,0.75)' }}>
                {c}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-2 max-h-[520px] overflow-auto pr-1">
            {sorted.map((tpl) => {
              const active = selected?.id === tpl.id;
              return (
                <button key={tpl.id} onClick={() => setSelected(tpl)} className="w-full text-left rounded-xl p-3" style={{ background: active ? 'rgba(59,130,246,0.16)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.1)'}` }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{tpl.name}</p>
                    {recommendedIds.includes(tpl.id) ? <span className="text-[10px] text-emerald-300">Recommended</span> : null}
                  </div>
                  <p className="text-xs text-white/60 mt-1">{tpl.category} · {tpl.usage_count.toLocaleString()} uses</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.22)' }}>
          {!selected ? <p className="text-white/60">Select a template to preview workflow steps.</p> : (
            <>
              <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
              <p className="text-sm text-white/72 mt-1">{selected.description}</p>
              <div className="mt-3 inline-flex px-2.5 py-1 rounded-full text-xs text-emerald-300" style={{ background: 'rgba(16,185,129,0.18)' }}>
                Estimated time saved: {selected.estimated_time_saved}
              </div>

              <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[11px] text-white/50 uppercase tracking-wider mb-2">Workflow preview</p>
                <div className="space-y-2">
                  {selected.workflow_steps.map((step, idx) => (
                    <div key={`${selected.id}-${idx}`} className="rounded-lg px-3 py-2 text-sm text-white/78" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      {idx + 1}. {step.title}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={useTemplate} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                  Use Template
                </button>
                <button onClick={previewWorkflow} className="px-4 py-2 rounded-xl text-sm font-semibold text-white/85 border border-white/20">
                  Preview Workflow
                </button>
              </div>

              <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-2"><Sparkles size={14} className="text-emerald-300" /><p className="text-xs uppercase tracking-wider text-emerald-300">AI Customize</p></div>
                <textarea
                  value={companyContext}
                  onChange={(e) => setCompanyContext(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  placeholder="Customize for a 300-person fintech team with strict compliance checks"
                />
                <button onClick={customizeTemplate} disabled={loading} className="mt-2 inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#10b981,#0ea5e9)' }}>
                  Customize Template <ArrowRight size={13} />
                </button>
              </div>

              {suggestions.length > 0 ? (
                <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider mb-1">AI improvement suggestions</p>
                  {suggestions.map((s) => <p key={s} className="text-xs text-white/72">• {s}</p>)}
                </div>
              ) : null}

              {error ? <p className="text-red-300 text-xs mt-3">{error}</p> : null}
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};
