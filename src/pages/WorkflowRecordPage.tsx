import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlayCircle, Square, MousePointer2, Keyboard, Navigation as NavIcon, Sparkles, ArrowRight } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type ActionRecordingEvent } from '../lib/api';
import { setPostAuthRedirect } from '../lib/postAuthRedirect';
import { setSopBuilderHandoff } from '../lib/sopHandoff';

type RecordMode = 'screen' | 'browser' | 'manual';

export const WorkflowRecordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token: authToken } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [mode, setMode] = useState<RecordMode>('manual');
  const [title, setTitle] = useState('Recorded Workflow SOP');
  const [description, setDescription] = useState('');
  const [recording, setRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [events, setEvents] = useState<ActionRecordingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canStop = recording && (events.length > 0 || mode !== 'manual');

  const ensureAuth = () => {
    if (token) return true;
    setPostAuthRedirect(location.pathname);
    navigate('/signin', { state: { redirectTo: location.pathname } });
    return false;
  };

  const pushEvent = async (eventType: string, target: string, value = '') => {
    const event: ActionRecordingEvent = { eventType, target, value, url: window.location.pathname };
    setEvents((prev) => [...prev, event]);
    if (token && sessionId) {
      try {
        await api.actionRecordEvent(token, { sessionId, eventType, target, value, url: window.location.pathname });
      } catch {
        // Keep local events as fallback.
      }
    }
  };

  const startRecording = async () => {
    if (!ensureAuth()) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.actionRecordStart(token!, { mode, title });
      setSessionId(res.session.id);
      setRecording(true);
      setEvents([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start recording');
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = async () => {
    if (!token || !sessionId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.actionRecordStop(token, { sessionId, title, description, events });
      setSopBuilderHandoff({
        title: res.title || title,
        description,
        sourceMethod: 'recording',
        steps: res.steps,
        aiInsights: res.aiInsights,
      });
      navigate('/workflow-ai/sop-builder');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process recording');
    } finally {
      setLoading(false);
      setRecording(false);
    }
  };

  const timeline = useMemo(() => events.slice(-8).reverse(), [events]);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white">Start Recording</h1>
          <p className="text-white/55 mt-2">Capture any process and convert it into an editable SOP instantly.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Recording Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                {[
                  { id: 'screen', label: 'Screen Recording' },
                  { id: 'browser', label: 'Browser Activity' },
                  { id: 'manual', label: 'Manual Step Capture' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id as RecordMode)}
                    className="rounded-xl px-3 py-2.5 text-sm font-semibold"
                    style={{
                      background: mode === m.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${mode === m.id ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      color: mode === m.id ? '#93c5fd' : 'rgba(255,255,255,0.65)',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Workflow title"
                  className="rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional context"
                  className="rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {!recording ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startRecording}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
                  >
                    <PlayCircle size={16} /> {loading ? 'Starting...' : 'Start Recording'}
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: canStop ? 1.02 : 1 }}
                    whileTap={{ scale: canStop ? 0.98 : 1 }}
                    onClick={stopRecording}
                    disabled={!canStop || loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}
                  >
                    <Square size={14} /> {loading ? 'Processing...' : 'Stop & Process with AI'}
                  </motion.button>
                )}

                {recording ? (
                  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-300" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    Recording live
                  </span>
                ) : null}
              </div>

              {recording ? (
                <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-xs text-white/50 mb-2">Capture interactions</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => pushEvent('click', 'Primary Button')} className="px-3 py-2 rounded-lg text-xs text-white/70" style={{ background: 'rgba(255,255,255,0.08)' }}><MousePointer2 size={12} className="inline mr-1" />Capture Click</button>
                    <button onClick={() => pushEvent('input', 'Form Field', 'sample input')} className="px-3 py-2 rounded-lg text-xs text-white/70" style={{ background: 'rgba(255,255,255,0.08)' }}><Keyboard size={12} className="inline mr-1" />Capture Input</button>
                    <button onClick={() => pushEvent('navigate', 'Next Page', window.location.pathname)} className="px-3 py-2 rounded-lg text-xs text-white/70" style={{ background: 'rgba(255,255,255,0.08)' }}><NavIcon size={12} className="inline mr-1" />Capture Navigation</button>
                  </div>
                </div>
              ) : null}

              {error ? <p className="text-red-400 text-xs mt-3">{error}</p> : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.22)' }}>
              <div className="flex items-center gap-2 mb-2"><Sparkles size={14} className="text-blue-300" /><span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">AI Processing</span></div>
              <ul className="text-xs text-white/65 space-y-1.5">
                <li>Auto-generate structured steps from captured actions</li>
                <li>Detect missing checkpoints and sequence gaps</li>
                <li>Add clear titles, descriptions, and action tags</li>
                <li>Open directly in editable SOP Builder</li>
              </ul>
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Captured Preview</p>
              {timeline.length === 0 ? <p className="text-xs text-white/40">No events captured yet</p> : (
                <div className="space-y-2">
                  {timeline.map((e, idx) => (
                    <div key={`${e.eventType}-${idx}`} className="text-xs text-white/70 rounded-lg px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <span className="text-blue-300">{e.eventType}</span> on {e.target || 'interaction'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button onClick={() => navigate('/workflow-ai/sop-builder')} className="text-sm text-white/55 hover:text-white inline-flex items-center gap-1">
            Open SOP Builder directly <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </AppShell>
  );
};
