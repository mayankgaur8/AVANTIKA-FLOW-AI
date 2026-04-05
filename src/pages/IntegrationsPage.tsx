import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { ProductHero } from '../components/ProductHero';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type PlatformIntegrationTool, type PlatformTriggerSource, type PlatformWorkflow } from '../lib/api';
import { setPostAuthRedirect } from '../lib/postAuthRedirect';
import { setSopBuilderHandoff } from '../lib/sopHandoff';

export const IntegrationsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token: authToken } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [connections, setConnections] = useState<PlatformIntegrationTool[]>([]);
  const [query, setQuery] = useState('onboarding');
  const [searchResults, setSearchResults] = useState<PlatformWorkflow[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState('');
  const [triggerSource, setTriggerSource] = useState<PlatformTriggerSource>('chat');
  const [embedCode, setEmbedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ensureAuth = () => {
    if (token) return true;
    setPostAuthRedirect('/platform/integrations');
    navigate('/signin', { state: { redirectTo: '/platform/integrations', sourcePage: location.pathname } });
    return false;
  };

  const loadConnections = async () => {
    if (!token) return;
    try {
      const res = await api.platformIntegrationConnections(token);
      setConnections(res.connections);
    } catch {
      setConnections([]);
    }
  };

  useEffect(() => {
    loadConnections();
  }, [token]);

  const connectTool = async (tool: PlatformIntegrationTool) => {
    if (!ensureAuth()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.platformIntegrationConnect(token!, tool);
      setConnections(res.connections);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to connect integration');
    } finally {
      setLoading(false);
    }
  };

  const search = async () => {
    if (!ensureAuth()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.platformIntegrationSearch(token!, query.trim());
      setSearchResults(res.results);
      if (res.results[0]) setSelectedGuideId(res.results[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const triggerWorkflow = async () => {
    if (!ensureAuth()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.platformIntegrationTrigger(token!, { source: triggerSource, query: query.trim(), guideId: selectedGuideId || undefined });
      setSopBuilderHandoff({
        title: `${res.workflow.title} (${triggerSource} trigger)` ,
        description: res.summary,
        sourceMethod: 'template',
        steps: res.steps,
        aiInsights: res.aiInsights,
      });
      navigate('/workflow-ai/sop-builder');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Trigger failed');
    } finally {
      setLoading(false);
    }
  };

  const generateEmbed = async () => {
    if (!ensureAuth() || !selectedGuideId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.platformIntegrationEmbed(token!, { guideId: selectedGuideId, target: 'internal-tool' });
      setEmbedCode(res.embedCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Embed generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c1b]">
      <div style={{ background: '#050c18' }}><Navigation /></div>
      <ProductHero
        dark
        badge="Integrations & API"
        title="Put answers at everyone's fingertips"
        subtitle="Connect team tools, trigger workflows from chat/API/events, and embed process intelligence across your stack."
        primaryCta={
          <button
            onClick={search}
            className="px-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-violet-600"
          >
            {loading ? 'Working...' : 'Find workflows'}
          </button>
        }
        rightVisual={<div className="h-72 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-violet-500/20" />}
      />

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs tracking-[0.18em] text-blue-300 font-semibold">STEP 1: CONNECT TOOLS</p>
            <div className="mt-3 grid sm:grid-cols-2 gap-2">
              {[
                { key: 'slack', label: 'Slack' },
                { key: 'teams', label: 'Teams' },
                { key: 'jira', label: 'Jira' },
                { key: 'crm-erp', label: 'CRM / ERP' },
              ].map((tool) => {
                const connected = connections.includes(tool.key as PlatformIntegrationTool);
                return (
                  <button
                    key={tool.key}
                    onClick={() => connectTool(tool.key as PlatformIntegrationTool)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold"
                    style={{
                      background: connected ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${connected ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.12)'}`,
                      color: connected ? '#6ee7b7' : 'rgba(255,255,255,0.75)',
                    }}
                  >
                    {connected ? `Connected: ${tool.label}` : `Connect ${tool.label}`}
                  </button>
                );
              })}
            </div>

            <p className="mt-5 text-xs tracking-[0.18em] text-blue-300 font-semibold">STEP 2: SEARCH WORKFLOWS</p>
            <div className="mt-2 flex gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} placeholder="Search by process name" />
              <button onClick={search} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>Search</button>
            </div>

            <div className="mt-3 space-y-2 max-h-40 overflow-auto pr-1">
              {searchResults.map((g) => (
                <button key={g.id} onClick={() => setSelectedGuideId(g.id)} className="w-full text-left rounded-lg px-3 py-2 text-xs" style={{ background: selectedGuideId === g.id ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.05)', border: `1px solid ${selectedGuideId === g.id ? 'rgba(59,130,246,0.42)' : 'rgba(255,255,255,0.1)'}`, color: 'rgba(255,255,255,0.8)' }}>
                  {g.title}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.24)' }}>
            <p className="text-xs tracking-[0.18em] text-blue-300 font-semibold">STEP 3: TRIGGER + EMBED</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(['chat', 'api', 'event'] as PlatformTriggerSource[]).map((s) => (
                <button key={s} onClick={() => setTriggerSource(s)} className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: triggerSource === s ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)', color: triggerSource === s ? '#93c5fd' : 'rgba(255,255,255,0.7)' }}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={triggerWorkflow} disabled={!selectedGuideId} className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                Trigger workflow
              </button>
              <button onClick={generateEmbed} disabled={!selectedGuideId} className="px-4 py-2 rounded-xl text-sm font-semibold text-white/85 border border-white/20 disabled:opacity-50">
                Generate embed
              </button>
            </div>

            {embedCode ? (
              <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <p className="text-[11px] text-white/50 uppercase tracking-wider mb-2">Embed snippet</p>
                <pre className="text-[11px] text-white/80 whitespace-pre-wrap break-words">{embedCode}</pre>
              </div>
            ) : null}

            <button onClick={() => navigate('/workflow-ai/sop-builder')} className="mt-4 inline-flex items-center gap-1 text-sm text-white/65 hover:text-white">
              Open shared workflow builder <ArrowRight size={14} />
            </button>

            {error ? <p className="text-red-300 text-xs mt-3">{error}</p> : null}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};
