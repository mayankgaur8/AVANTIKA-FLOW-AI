import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Trash2,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type RecentGuide, type RecentActivity } from '../lib/api';

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

const CARD_COLORS = ['#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fb923c', '#38bdf8', '#e879f9', '#facc15'];

function RecentGuideCard({
  guide,
  color,
  onOpen,
  onShare,
  onDuplicate,
  onDelete,
}: {
  guide: RecentGuide;
  color: string;
  onOpen: (id: string) => void;
  onShare: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
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
          <div className="relative" onClick={(e) => e.stopPropagation()}>
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
                      onClick={() => {
                        action();
                        setMenuOpen(false);
                      }}
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
            {guide.totalSteps} steps
          </span>
          {guide.status === 'published' && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
              Published
            </span>
          )}
        </div>
      </button>

      <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>
          <Clock size={11} /> {timeAgo(guide.updatedAt)}
        </span>
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.32)' }}>
          {guide.views} views
        </span>
      </div>
    </motion.div>
  );
}

function RecentActivityItem({ activity }: { activity: RecentActivity }) {
  const typeIcons = {
    viewed: <Clock size={14} style={{ color: '#60a5fa' }} />,
    edited: <FileText size={14} style={{ color: '#a78bfa' }} />,
    shared: <Users size={14} style={{ color: '#34d399' }} />,
    published: <ExternalLink size={14} style={{ color: '#fb923c' }} />,
    created: <FileText size={14} style={{ color: '#f472b6' }} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-4 py-3 px-4 rounded-lg transition-colors hover:bg-white/5"
    >
      <div className="flex-shrink-0 mt-1">
        {typeIcons[activity.type as keyof typeof typeIcons] || <Clock size={14} style={{ color: '#60a5fa' }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{activity.action}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {timeAgo(activity.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}

function RecentSkeleton() {
  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto animate-pulse">
      <div className="h-12 rounded-xl mb-8 w-64" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <div className="h-8 rounded-lg mb-6 w-48" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        </div>
        <div>
          <div className="h-8 rounded-lg mb-6 w-40" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentEmptyState() {
  return (
    <div className="px-6 py-20 max-w-2xl mx-auto text-center">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
        style={{ background: 'rgba(96, 165, 250, 0.1)' }}
      >
        <Clock size={28} style={{ color: '#60a5fa' }} />
      </motion.div>
      <h2 className="text-xl font-bold text-white mb-2">No recent activity</h2>
      <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
        Your recently opened guides and workflow activity will appear here.
      </p>
      <button
        onClick={() => window.location.href = '/dashboard'}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all"
        style={{ background: '#60a5fa', color: 'white' }}
      >
        <FileText size={16} />
        Browse all guides
      </button>
    </div>
  );
}

export const RecentPage = () => {
  const navigate = useNavigate();
  const { token: authToken, user } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentGuides, setRecentGuides] = useState<RecentGuide[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const loadRecent = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.dashboardRecent(token);
      setRecentGuides(data.recentGuides || []);
      setRecentActivity(data.recentActivity || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleOpenGuide = (id: string) => {
    navigate(`/guides/${id}`);
  };

  const handleShareGuide = () => {
    // TODO: Implement share
  };

  const handleDuplicateGuide = () => {
    // TODO: Implement duplicate
  };

  const handleDeleteGuide = () => {
    // TODO: Implement delete
  };

  const isEmpty = !loading && recentGuides.length === 0 && recentActivity.length === 0;

  return (
    <AppShell primaryCtaLabel="New Guide" contentClassName="">
      <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)' }}>
        {loading && <RecentSkeleton />}

        {!loading && isEmpty && <RecentEmptyState />}

        {!loading && !isEmpty && (
          <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <h1 className="text-4xl font-black text-white mb-2">Recent</h1>
              <p className="text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Guides and workflow activity you opened recently
              </p>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-10">
              {/* Recently opened guides */}
              <div className="xl:col-span-2">
                {recentGuides.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                    <h2 className="text-lg font-bold text-white mb-6">Recently Opened</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <AnimatePresence>
                        {recentGuides.map((guide, index) => (
                          <RecentGuideCard
                            key={guide.id}
                            guide={guide}
                            color={CARD_COLORS[index % CARD_COLORS.length]}
                            onOpen={handleOpenGuide}
                            onShare={handleShareGuide}
                            onDuplicate={handleDuplicateGuide}
                            onDelete={handleDeleteGuide}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Recent activity timeline */}
              <div>
                {recentActivity.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
                    <h2 className="text-lg font-bold text-white mb-6">Activity Timeline</h2>
                    <div
                      className="rounded-xl p-4 space-y-2"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <AnimatePresence>
                        {recentActivity.map((activity) => (
                          <RecentActivityItem key={activity.id} activity={activity} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-8 max-w-2xl mx-auto"
          >
            <div
              className="flex items-start gap-4 p-4 rounded-lg"
              style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)' }}
            >
              <AlertCircle size={20} style={{ color: '#f87171', flexShrink: 0 }} />
              <div>
                <p className="text-sm font-medium text-white">Error loading recent activity</p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {error}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
};
