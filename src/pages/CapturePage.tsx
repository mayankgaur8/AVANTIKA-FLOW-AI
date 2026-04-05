import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MousePointer2, Keyboard, Navigation as NavIcon, PlayCircle, Square, Sparkles } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { ProductHero } from '../components/ProductHero';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { authStore } from '../lib/auth';
import { setPostAuthRedirect } from '../lib/postAuthRedirect';
import { setSopBuilderHandoff } from '../lib/sopHandoff';

type CaptureMode = 'screen' | 'browser' | 'manual';

export const CapturePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token: authToken } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [title, setTitle] = useState('Captured Workflow SOP');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<CaptureMode>('screen');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [events, setEvents] = useState<Array<{ eventType: string; target: string; value?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ensureAuth = () => {
    if (token) return true;
    setPostAuthRedirect('/product/capture');
    navigate('/signin', { state: { redirectTo: '/product/capture', sourcePage: location.pathname } });
    return false;
  };

  const startCaptureFlow = async () => {
    if (!ensureAuth()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.actionRecordStart(token!, { mode, title });
      setSessionId(res.session.id);
      setRecording(true);
      setEvents([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to start capture');
    } finally {
      setLoading(false);
    }
  };

  const captureEvent = async (eventType: string, target: string, value = '') => {
    if (!recording) return;
    setEvents((prev) => [...prev, { eventType, target, value }]);
    if (!token || !sessionId) return;
    try {
      await api.actionRecordEvent(token, { sessionId, eventType, target, value, url: window.location.pathname });
    } catch {
      // Keep local capture experience responsive when network call fails.
    }
  };

  const generateGuide = async () => {
    if (!token || !sessionId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.actionRecordStop(token, { sessionId, title, description, events });
      setSopBuilderHandoff({
        title: res.title,
        description,
        sourceMethod: 'recording',
        steps: res.steps,
        aiInsights: res.aiInsights,
      });
      navigate('/workflow-ai/sop-builder');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to generate guide');
    } finally {
      setLoading(false);
      setRecording(false);
    }
  };

  const preview = useMemo(() => events.slice(-6).reverse(), [events]);

  return (
    <div className="min-h-screen bg-[#070c1b]">
      <div style={{ background: '#050c18' }}><Navigation /></div>
      <ProductHero
        dark
        badge="Capture"
        title="Documentation that writes itself"
        subtitle="Capture workflows from screen, browser, or manual actions and auto-generate reusable SOPs with AI."
        primaryCta={(
          <button
            onClick={startCaptureFlow}
            disabled={loading || recording}
            className="px-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-violet-600"
          >
            {recording ? 'Capture in progress' : loading ? 'Starting capture...' : 'Start capture'}
          </button>
        )}
        secondaryCta={(
          <button
            onClick={() => navigate('/workflow-ai/examples')}
            className="px-6 py-3 rounded-xl border border-white/20 text-white/85 font-semibold"
          >
            View examples
          </button>
        )}
        rightVisual={
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl">
            <p className="text-sm text-blue-300 font-semibold">AI extraction engine</p>
            <h3 className="text-2xl font-black text-white mt-2">From raw actions to structured SOP in seconds</h3>
            <p className="text-white/60 mt-2">Auto-step generation, action recognition, and missing-step detection built in.</p>
          </div>
        }
      />
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs tracking-[0.18em] text-blue-300 font-semibold">STEP 1: START CAPTURE</p>
            <div className="mt-3 grid sm:grid-cols-3 gap-2">
              {[
                { id: 'screen', label: 'Screen recording' },
                { id: 'browser', label: 'Browser capture' },
                { id: 'manual', label: 'Manual input' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as CaptureMode)}
                  className="rounded-lg px-3 py-2 text-xs font-semibold"
                  style={{
                    background: mode === m.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${mode === m.id ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.12)'}`,
                    color: mode === m.id ? '#93c5fd' : 'rgba(255,255,255,0.72)',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
                placeholder="Workflow title"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
                placeholder="Add context for AI optimization"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => captureEvent('click', 'Primary button')} disabled={!recording} className="px-3 py-2 rounded-lg text-xs text-white/75 disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.08)' }}><MousePointer2 size={12} className="inline mr-1" />Capture click</button>
              <button onClick={() => captureEvent('input', 'Form field', 'sample value')} disabled={!recording} className="px-3 py-2 rounded-lg text-xs text-white/75 disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.08)' }}><Keyboard size={12} className="inline mr-1" />Capture input</button>
              <button onClick={() => captureEvent('navigate', 'Next screen')} disabled={!recording} className="px-3 py-2 rounded-lg text-xs text-white/75 disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.08)' }}><NavIcon size={12} className="inline mr-1" />Capture navigation</button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {!recording ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startCaptureFlow} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                  <PlayCircle size={14} /> {loading ? 'Starting...' : 'Start Capture'}
                </motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={generateGuide} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold" style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)' }}>
                  <Square size={14} /> {loading ? 'Generating...' : 'Generate guide'}
                </motion.button>
              )}
              {recording ? <span className="px-2.5 py-2 rounded-lg text-xs font-semibold text-red-300" style={{ background: 'rgba(239,68,68,0.15)' }}>Live capture</span> : null}
            </div>

            {error ? <p className="text-red-300 text-xs mt-3">{error}</p> : null}
          </div>

          <div className="rounded-2xl p-6" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.24)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-blue-300" />
              <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider">AI Extraction + Guide Generation</p>
            </div>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li>Detect actions, clicks, inputs, and navigation automatically</li>
              <li>Generate titles, step descriptions, tags, and categories</li>
              <li>Surface missing-step warnings before publishing</li>
              <li>Open directly in shared SOP Builder for edit, save, and reuse</li>
            </ul>

            <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Captured timeline</p>
              {preview.length === 0 ? <p className="text-xs text-white/45">No captured actions yet</p> : (
                <div className="space-y-1.5">
                  {preview.map((item, idx) => (
                    <div key={`${item.eventType}-${idx}`} className="text-xs text-white/75">{item.eventType} on {item.target}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
