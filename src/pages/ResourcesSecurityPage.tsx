import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type SecurityDoc } from '../lib/api';
import { setPostAuthRedirect } from '../lib/postAuthRedirect';

export const ResourcesSecurityPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token: authToken } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [docs, setDocs] = useState<SecurityDoc[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryPoints, setSummaryPoints] = useState<string[]>([]);
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [auditScope, setAuditScope] = useState('All workflows');
  const [auditReport, setAuditReport] = useState<{ reportTitle: string; findings: string[]; compliance: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ensureAuth = () => {
    if (token) return true;
    setPostAuthRedirect('/resources/security');
    navigate('/signin', { state: { redirectTo: '/resources/security', sourcePage: location.pathname } });
    return false;
  };

  useEffect(() => {
    api.resourcesSecurityDocs()
      .then((res) => {
        setDocs(res.docs);
        if (res.docs[0]) setSelectedDocId(res.docs[0].id);
      })
      .catch(() => setDocs([]));
  }, []);

  const selected = docs.find((d) => d.id === selectedDocId) || null;

  const summarizeDoc = async () => {
    if (!selectedDocId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.resourcesSecuritySummarize(selectedDocId);
      setSummary(res.summary);
      setSummaryPoints(res.keyPoints);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to summarize document');
    } finally {
      setLoading(false);
    }
  };

  const askSecurity = async () => {
    if (!aiQuery.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.resourcesSecurityAsk(aiQuery.trim());
      setAiAnswer(res.answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to process security query');
    } finally {
      setLoading(false);
    }
  };

  const generateAudit = async () => {
    if (!ensureAuth()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.resourcesSecurityAuditReport(token!, auditScope.trim() || 'All workflows');
      setAuditReport({ reportTitle: res.reportTitle, findings: res.findings, compliance: res.compliance });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to generate audit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c1b]">
      <Navigation />

      <section className="max-w-6xl mx-auto px-6 pt-12 pb-6">
        <p className="text-xs text-blue-300 font-semibold tracking-[0.18em]">RESOURCES</p>
        <h1 className="text-4xl font-black text-white mt-2">Security</h1>
        <p className="text-white/60 mt-2">Enterprise-grade security you can trust.</p>

        <div className="mt-4 flex gap-2 text-sm flex-wrap">
          <Link to="/resources/templates" className="px-3 py-2 rounded-lg text-white/70" style={{ background: 'rgba(255,255,255,0.08)' }}>Template Gallery</Link>
          <Link to="/resources/security" className="px-3 py-2 rounded-lg text-blue-300" style={{ background: 'rgba(59,130,246,0.2)' }}>Security</Link>
          <Link to="/resources/guides" className="px-3 py-2 rounded-lg text-white/70" style={{ background: 'rgba(255,255,255,0.08)' }}>Latest Guides</Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs text-white/45 uppercase tracking-wider mb-2">Security docs</p>
          <div className="space-y-2">
            {docs.map((doc) => (
              <button key={doc.id} onClick={() => setSelectedDocId(doc.id)} className="w-full text-left rounded-lg p-3" style={{ background: selectedDocId === doc.id ? 'rgba(59,130,246,0.16)' : 'rgba(255,255,255,0.06)', border: `1px solid ${selectedDocId === doc.id ? 'rgba(59,130,246,0.42)' : 'rgba(255,255,255,0.12)'}` }}>
                <p className="text-sm text-white font-semibold">{doc.title}</p>
                <p className="text-xs text-white/60 mt-1">{doc.category} · {doc.compliance_type}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.22)' }}>
          {!selected ? <p className="text-white/60">Select a security document.</p> : (
            <>
              <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-blue-300" /><h2 className="text-2xl font-bold text-white">{selected.title}</h2></div>
              <p className="text-sm text-white/75 mt-2">{selected.content}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={summarizeDoc} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                  Summarize compliance doc
                </button>
                <button onClick={() => window.open('/docs', '_self')} className="px-4 py-2 rounded-xl text-sm font-semibold text-white/85 border border-white/20">
                  View security docs
                </button>
              </div>

              {summary ? (
                <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-[11px] text-white/50 uppercase tracking-wider mb-1">AI Summary</p>
                  <p className="text-sm text-white/78">{summary}</p>
                  {summaryPoints.map((p) => <p key={p} className="text-xs text-white/70 mt-1">• {p}</p>)}
                </div>
              ) : null}

              <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[11px] text-emerald-300 uppercase tracking-wider mb-2">Security AI Assistant</p>
                <div className="flex gap-2">
                  <input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} placeholder="Ask about encryption, SOC2, RBAC..." className="flex-1 rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />
                  <button onClick={askSecurity} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#10b981,#0ea5e9)' }}>Ask</button>
                </div>
                {aiAnswer ? <p className="text-sm text-white/78 mt-2">{aiAnswer}</p> : null}
              </div>

              <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[11px] text-amber-300 uppercase tracking-wider mb-2">Generate audit report</p>
                <div className="flex gap-2">
                  <input value={auditScope} onChange={(e) => setAuditScope(e.target.value)} className="flex-1 rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />
                  <button onClick={generateAudit} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}>
                    Generate
                  </button>
                </div>
                {auditReport ? (
                  <div className="mt-2">
                    <p className="text-sm text-white font-semibold">{auditReport.reportTitle}</p>
                    {auditReport.findings.map((f) => <p key={f} className="text-xs text-white/75 mt-1">• {f}</p>)}
                    <p className="text-xs text-white/65 mt-2">Compliance: {auditReport.compliance.join(', ')}</p>
                  </div>
                ) : null}
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
