import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  MoreHorizontal,
  PlayCircle,
  Sparkles,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import {
  api,
  type DashboardBootstrapResponse,
  type DashboardChecklistItem,
  type DashboardGuide,
} from '../lib/api';

const CARD_COLORS = ['#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fb923c', '#38bdf8', '#e879f9', '#facc15'];

const timeAgo = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(ms / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

interface GuideCardProps {
  guide: DashboardGuide;
  color: string;
  onOpen: (id: string) => void;
  onShare: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onFavorite: (id: string, current: boolean) => void;
}

function GuideCard({ guide, color, onOpen, onShare, onDuplicate, onDelete, onFavorite }: GuideCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isFav = Boolean(guide.is_favorite);

  const menuItems = [
    { label: 'Open', icon: <ExternalLink size={12} />, action: () => onOpen(guide.id) },
    { label: 'Share', icon: <Users size={12} />, action: () => onShare(guide.id) },
    { label: 'Duplicate', icon: <Copy size={12} />, action: () => onDuplicate(guide.id) },
    { label: 'Delete', icon: <Trash2 size={12} />, action: () => onDelete(guide.id), danger: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}
      className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 group"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="h-1.5 w-full flex-shrink-0" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

      <button className="flex-1 p-5 text-left" onClick={() => onOpen(guide.id)}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
            <FileText size={18} style={{ color }} strokeWidth={1.8} />
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onFavorite(guide.id, isFav)}
              title={isFav ? 'Remove from favorites' : 'Add to favorites'}
              className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: isFav ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}
            >
              <Star size={14} fill={isFav ? '#f59e0b' : 'none'} />
            </button>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.08)' }}
            >
              <MoreHorizontal size={14} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-8 w-40 rounded-xl overflow-hidden z-20 py-1"
                  style={{ background: '#0f1d2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  {menuItems.map(({ label, icon, action, danger }) => (
                    <button
                      key={label}
                      className="w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-white/5 flex items-center gap-2"
                      style={{ color: danger ? '#f87171' : 'rgba(255,255,255,0.65)' }}
                      onClick={() => { action(); setMenuOpen(false); }}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <h3 className="text-sm font-bold text-white mb-1.5 leading-snug">{guide.title}</h3>

        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {guide.steps} steps
          </span>
          {guide.shared && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
              <Users size={10} /> Team
            </span>
          )}
        </div>
      </button>

      <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>
          <Clock size={11} /> {timeAgo(guide.updated_at)}
        </span>
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.32)' }}>
          {guide.views} views
        </span>
      </div>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="px-6 py-8 max-w-6xl mx-auto animate-pulse">
      <div className="h-20 rounded-2xl mb-6" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
        <div className="space-y-5">
          <div className="h-40 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-52 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      </div>
    </div>
  );
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { token: authToken, user } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardBootstrapResponse | null>(null);
  const [guideModeOpen, setGuideModeOpen] = useState(false);
  const [guideHintVisible, setGuideHintVisible] = useState(true);

  const loadDashboard = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const next = await api.dashboardBootstrap(token);
      setData(next);
      if (!next.workspace) {
        navigate('/onboarding/team', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const nextChecklistStep = useMemo(
    () => data?.checklist.items.find((item: DashboardChecklistItem) => !item.completed) || null,
    [data],
  );

  const primaryCtaLabel = !data || data.guides.length === 0 ? 'Create your first guide' : 'New Guide';

  const createGuide = async (mode: 'recording' | 'manual', isSample = false) => {
    if (!token) return;
    const title = isSample
      ? 'Sample: Customer Onboarding Flow'
      : mode === 'recording'
        ? 'Recorded Workflow Guide'
        : 'Manual Workflow Guide';
    await api.dashboardCreateGuide(token, { title, mode, isSample });
    setGuideModeOpen(false);
    setGuideHintVisible(false);
    await loadDashboard();
  };

  const shareFirstGuide = async () => {
    if (!token || !data?.guides?.length) return;
    const firstUnshared = data.guides.find((g) => !g.shared) || data.guides[0];
    await api.dashboardShareGuide(token, firstUnshared.id);
    await loadDashboard();
  };

  const markChecklistStep = async (key: string) => {
    if (!token) return;
    await api.completeChecklistStep(token, key);
    await loadDashboard();
  };

  const handleChecklistAction = async (item: DashboardChecklistItem) => {
    if (!token) return;
    if (item.key === 'workspaceCreated') {
      navigate('/onboarding/team');
      return;
    }
    if (item.key === 'invitedTeam') {
      const email = window.prompt('Invite teammate by email:');
      if (!email) return;
      await api.onboardingInvite(token, [email]);
      await loadDashboard();
      return;
    }
    if (item.key === 'installedExtension') {
      window.open('https://chromewebstore.google.com/', '_blank', 'noopener,noreferrer');
      await markChecklistStep('installedExtension');
      return;
    }
    if (item.key === 'createdGuide') {
      setGuideModeOpen(true);
      return;
    }
    if (item.key === 'sharedGuide') {
      await shareFirstGuide();
    }
  };

  const handleDuplicateGuide = async (guideId: string) => {
    if (!token) return;
    await api.duplicateGuide(token, guideId);
    await loadDashboard();
  };

  const handleDeleteGuide = async (guideId: string) => {
    if (!token) return;
    if (!window.confirm('Delete this guide? This cannot be undone.')) return;
    await api.deleteGuide(token, guideId);
    await loadDashboard();
  };

  const handleFavoriteGuide = async (guideId: string, isCurrent: boolean) => {
    if (!token || !data) return;
    setData((prev) => prev ? {
      ...prev,
      guides: prev.guides.map((g) => g.id === guideId ? { ...g, is_favorite: !isCurrent } : g),
    } : prev);
    try {
      if (isCurrent) {
        await api.removeFavorite(token, guideId);
      } else {
        await api.addFavorite(token, guideId);
      }
    } catch {
      // revert on failure
      setData((prev) => prev ? {
        ...prev,
        guides: prev.guides.map((g) => g.id === guideId ? { ...g, is_favorite: isCurrent } : g),
      } : prev);
    }
  };

  const handleShareGuide = async (guideId: string) => {
    if (!token) return;
    await api.dashboardShareGuide(token, guideId);
    await loadDashboard();
  };

  return (
    <AppShell
      workspaceName={data?.workspace?.name || user?.team_name || null}
      primaryCtaLabel={primaryCtaLabel}
      primaryCtaHighlighted={Boolean(nextChecklistStep && !nextChecklistStep.completed)}
      onNewGuide={() => setGuideModeOpen(true)}
    >
      <div className="px-6 py-8 max-w-6xl mx-auto">
        {loading && <DashboardSkeleton />}

        {!loading && error && (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)' }}>
            <AlertCircle size={22} className="mx-auto mb-3" style={{ color: '#fca5a5' }} />
            <h2 className="text-white text-lg font-bold mb-2">Unable to load dashboard</h2>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>{error}</p>
            <button
              onClick={loadDashboard}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {data.checklist.percent < 100 && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl mb-8 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.10))', border: '1px solid rgba(139,92,246,0.25)' }}
              >
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: '#a78bfa' }}>GETTING STARTED</p>
                    <h2 className="text-sm font-bold text-white">Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! Keep moving forward</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                      <div className="h-full" style={{ width: `${data.checklist.percent}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.62)' }}>{data.checklist.percent}%</span>
                  </div>
                </div>
                <div>
                  {data.checklist.items.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleChecklistAction(item)}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-white/5"
                    >
                      {item.completed ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} style={{ color: 'rgba(255,255,255,0.28)' }} />}
                      <span className="text-sm flex-1" style={{ color: item.completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.82)', textDecoration: item.completed ? 'line-through' : 'none' }}>
                        {item.label}
                      </span>
                      {!item.completed && <ArrowRight size={13} style={{ color: '#a78bfa' }} />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-black text-white">My Guides</h1>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.42)' }}>
                  {data.guides.length} guides in {data.workspace?.name || 'your workspace'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3">
                {data.guides.length === 0 ? (
                  <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.14)' }}>
                    <Sparkles className="mx-auto mb-3" size={22} style={{ color: '#93c5fd' }} />
                    <h3 className="text-white text-lg font-bold mb-1">Create your first guide</h3>
                    <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.58)' }}>
                      Start recording your workflow now, or spin up a sample guide to see value instantly.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => setGuideModeOpen(true)}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                      >
                        Create your first guide
                      </button>
                      <button
                        onClick={() => createGuide('manual', true)}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ color: 'white', border: '1px solid rgba(255,255,255,0.18)' }}
                      >
                        Auto-create sample guide
                      </button>
                      <button
                        onClick={() => window.open('https://www.youtube.com/results?search_query=scribe+product+demo', '_blank', 'noopener,noreferrer')}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.10)' }}
                      >
                        Watch how it works
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.guides.map((guide, i) => (
                      <motion.div
                        key={guide.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <GuideCard
                          guide={guide}
                          color={CARD_COLORS[i % CARD_COLORS.length]}
                          onOpen={(id) => navigate(`/guides/${id}`)}
                          onShare={handleShareGuide}
                          onDuplicate={handleDuplicateGuide}
                          onDelete={handleDeleteGuide}
                          onFavorite={handleFavoriteGuide}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="xl:col-span-1 space-y-5">
                {nextChecklistStep && (
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.22)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#fbbf24' }}>Next recommended action</p>
                    <button onClick={() => handleChecklistAction(nextChecklistStep)} className="w-full text-left text-sm font-semibold text-white">
                      {nextChecklistStep.label}
                    </button>
                  </div>
                )}

                <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="text-sm font-bold text-white mb-4">This month</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Guides created', value: String(data.stats.guidesCreated), accent: '#60a5fa' },
                      { label: 'Total views', value: String(data.stats.totalViews), accent: '#a78bfa' },
                      { label: 'Team members', value: String(data.stats.teamMembers), accent: '#34d399' },
                    ].map(({ label, value, accent }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                        <span className="text-sm font-bold" style={{ color: accent }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="text-sm font-bold text-white mb-4">Recent activity</h3>
                  <div className="space-y-3">
                    {data.recentActivity.length === 0 && (
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Your actions will appear here.</span>
                    )}
                    {data.recentActivity.map((activity) => (
                      <button
                        key={activity.id}
                        className="w-full text-left flex flex-col gap-0.5"
                        onClick={() => {
                          if (activity.guide_id) navigate(`/guides/${activity.guide_id}`);
                        }}
                      >
                        <span className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.65)' }}>{activity.text}</span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{timeAgo(activity.created_at)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {guideHintVisible && data.guides.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="fixed bottom-6 right-6 max-w-xs rounded-2xl p-4 z-40"
                  style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(59,130,246,0.28)', boxShadow: '0 10px 35px rgba(2,6,23,0.45)' }}
                >
                  <p className="text-xs font-semibold mb-1" style={{ color: '#93c5fd' }}>Product guidance</p>
                  <p className="text-sm text-white mb-3">Start by creating your first guide to unlock sharing and team collaboration.</p>
                  <button onClick={() => setGuideModeOpen(true)} className="text-xs font-semibold" style={{ color: '#bfdbfe' }}>
                    Start now →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {guideModeOpen && (
                <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="absolute inset-0 bg-black/65" onClick={() => setGuideModeOpen(false)} />
                  <motion.div
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.97, opacity: 0 }}
                    className="relative w-full max-w-md rounded-2xl p-6"
                    style={{ background: '#0b1426', border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    <h3 className="text-lg font-bold text-white mb-1">Create a new guide</h3>
                    <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.58)' }}>
                      Start recording workflow or build guide manually.
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={() => createGuide('recording')}
                        className="w-full text-left px-4 py-3 rounded-xl"
                        style={{ background: 'rgba(59,130,246,0.20)', border: '1px solid rgba(59,130,246,0.35)' }}
                      >
                        <span className="text-sm font-semibold text-white flex items-center gap-2"><PlayCircle size={16} /> Start recording workflow</span>
                      </button>
                      <button
                        onClick={() => createGuide('manual')}
                        className="w-full text-left px-4 py-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}
                      >
                        <span className="text-sm font-semibold text-white">Create guide manually</span>
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </AppShell>
  );
};
