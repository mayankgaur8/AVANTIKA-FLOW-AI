import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { api, type ResourceArticle, type ResourceTemplate } from '../lib/api';
import { setSopBuilderHandoff } from '../lib/sopHandoff';

const TYPES = ['All', 'guide', 'blog', 'update'];

export const ResourcesGuidesPage = () => {
  const { user } = useAuth();
  const [type, setType] = useState('All');
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<ResourceArticle[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [article, setArticle] = useState<ResourceArticle | null>(null);
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [templateMap, setTemplateMap] = useState<Record<string, ResourceTemplate>>({});

  useEffect(() => {
    const role = String((user as { role?: string } | null)?.role || '');
    api.resourcesGuides({ type: type === 'All' ? undefined : type, query: query.trim() || undefined, role })
      .then((res) => {
        setArticles(res.articles);
        setRecommendedIds(res.recommendedArticleIds);
        if (res.articles[0] && !selectedId) setSelectedId(res.articles[0].id);
      })
      .catch(() => {
        setArticles([]);
      });
  }, [type, query, user]);

  useEffect(() => {
    if (!selectedId) return;
    api.resourcesGuideById(selectedId)
      .then((res) => setArticle(res.article))
      .catch(() => setArticle(null));
  }, [selectedId]);

  useEffect(() => {
    if (!article) return;
    const missing = article.related_templates.filter((id) => !templateMap[id]);
    if (missing.length === 0) return;

    Promise.all(missing.map((id) => api.resourcesTemplateById(id).then((res) => res.template).catch(() => null)))
      .then((rows) => {
        const next = { ...templateMap };
        rows.forEach((tpl) => {
          if (tpl) next[tpl.id] = tpl;
        });
        setTemplateMap(next);
      });
  }, [article]);

  const ordered = useMemo(() => {
    return [...articles].sort((a, b) => {
      const aR = recommendedIds.includes(a.id) ? 1 : 0;
      const bR = recommendedIds.includes(b.id) ? 1 : 0;
      return bR - aR;
    });
  }, [articles, recommendedIds]);

  const summarize = async () => {
    if (!article) return;
    const res = await api.resourcesGuideSummarize(article.id);
    setSummary(res.summary);
    setKeyPoints(res.keyPoints);
  };

  const applyWorkflow = async () => {
    if (!article) return;
    const res = await api.resourcesGuideToWorkflow(article.id);
    setSopBuilderHandoff({
      title: res.title,
      description: article.summary,
      sourceMethod: 'ai-text',
      steps: res.steps,
      aiInsights: res.aiInsights,
    });
    window.location.href = '/workflow-ai/sop-builder';
  };

  const useRelatedTemplate = (templateId: string) => {
    const tpl = templateMap[templateId];
    if (!tpl) return;
    setSopBuilderHandoff({
      title: tpl.name,
      description: tpl.description,
      sourceMethod: 'template',
      steps: tpl.workflow_steps,
      aiInsights: [`Imported from article: ${article?.title || ''}`],
    });
    window.location.href = '/workflow-ai/sop-builder';
  };

  const shareArticle = async () => {
    if (!article) return;
    const link = `${window.location.origin}/resources/guides?article=${article.id}`;
    await navigator.clipboard.writeText(link);
  };

  return (
    <div className="min-h-screen bg-[#070c1b]">
      <Navigation />

      <section className="max-w-6xl mx-auto px-6 pt-12 pb-6">
        <p className="text-xs text-blue-300 font-semibold tracking-[0.18em]">RESOURCES</p>
        <h1 className="text-4xl font-black text-white mt-2">Latest Guides & Insights</h1>
        <p className="text-white/60 mt-2">Stay ahead with best practices and insights.</p>

        <div className="mt-4 flex gap-2 text-sm flex-wrap">
          <Link to="/resources/templates" className="px-3 py-2 rounded-lg text-white/70" style={{ background: 'rgba(255,255,255,0.08)' }}>Template Gallery</Link>
          <Link to="/resources/security" className="px-3 py-2 rounded-lg text-white/70" style={{ background: 'rgba(255,255,255,0.08)' }}>Security</Link>
          <Link to="/resources/guides" className="px-3 py-2 rounded-lg text-blue-300" style={{ background: 'rgba(59,130,246,0.2)' }}>Latest Guides</Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs text-white/45 uppercase tracking-wider">Explore</p>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search guides" className="mt-2 w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />
          <div className="mt-2 flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button key={t} onClick={() => setType(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: type === t ? 'rgba(59,130,246,0.22)' : 'rgba(255,255,255,0.08)', color: type === t ? '#93c5fd' : 'rgba(255,255,255,0.75)' }}>{t}</button>
            ))}
          </div>

          <div className="mt-3 space-y-2 max-h-[520px] overflow-auto pr-1">
            {ordered.map((a) => (
              <button key={a.id} onClick={() => setSelectedId(a.id)} className="w-full text-left rounded-xl p-3" style={{ background: selectedId === a.id ? 'rgba(59,130,246,0.16)' : 'rgba(255,255,255,0.05)', border: `1px solid ${selectedId === a.id ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.1)'}` }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{a.title}</p>
                  {recommendedIds.includes(a.id) ? <span className="text-[10px] text-emerald-300">Recommended</span> : null}
                </div>
                <p className="text-xs text-white/58 mt-1">{a.category} · {a.read_time}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.22)' }}>
          {!article ? <p className="text-white/60">Select an article to read.</p> : (
            <>
              <p className="text-xs uppercase tracking-wider text-blue-300">{article.category} · {article.read_time}</p>
              <h2 className="text-2xl font-bold text-white mt-2">{article.title}</h2>
              <p className="text-sm text-white/70 mt-2">{article.summary}</p>

              <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <p className="text-sm text-white/80 whitespace-pre-wrap">{article.content}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={summarize} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>Summarize article</button>
                <button onClick={applyWorkflow} className="px-4 py-2 rounded-xl text-sm font-semibold text-white/90 border border-white/20">Apply workflow</button>
                <button onClick={shareArticle} className="px-4 py-2 rounded-xl text-sm font-semibold text-white/90" style={{ background: 'rgba(255,255,255,0.12)' }}>Share article</button>
              </div>

              {summary ? (
                <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-[11px] text-emerald-300 uppercase tracking-wider">AI Summary</p>
                  <p className="text-sm text-white/78 mt-1">{summary}</p>
                  {keyPoints.map((k) => <p key={k} className="text-xs text-white/70 mt-1">• {k}</p>)}
                </div>
              ) : null}

              {article.related_templates.length > 0 ? (
                <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider mb-2">Use related template</p>
                  <div className="flex flex-wrap gap-2">
                    {article.related_templates.map((id) => (
                      <button key={id} onClick={() => useRelatedTemplate(id)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-white/85" style={{ background: 'rgba(59,130,246,0.18)' }}>
                        {(templateMap[id]?.name || id)} <ArrowRight size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};
