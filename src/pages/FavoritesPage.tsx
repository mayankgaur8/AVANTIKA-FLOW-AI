import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  LayoutDashboard,
  Lock,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
  Video,
  Youtube,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type FavoriteGuide } from '../lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeAgo = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(ms / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : `${Math.floor(days / 30)}mo ago`;
};

const CARD_COLORS = ['#f59e0b', '#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fb923c', '#38bdf8', '#e879f9'];

type SortKey = 'updated' | 'views' | 'alpha';
type FilterKey = 'all' | 'published' | 'draft' | 'video';

// ─── Favorite Card ────────────────────────────────────────────────────────────

function FavoriteCard({
  guide,
  color,
  onOpen,
  onShare,
  onDuplicate,
  onUnfavorite,
}: {
  guide: FavoriteGuide;
  color: string;
  onOpen: (id: string) => void;
  onShare: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUnfavorite: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasVideo = Boolean(guide.video_type);

  const menuItems = [
    { label: 'Open', icon: <ExternalLink size={12} />, action: () => onOpen(guide.id) },
    { label: 'Share', icon: <Users size={12} />, action: () => onShare(guide.id) },
    { label: 'Duplicate', icon: <Copy size={12} />, action: () => onDuplicate(guide.id) },
    { label: 'Remove from Favorites', icon: <Star size={12} />, action: () => onUnfavorite(guide.id), danger: false, accent: true },
  ];

  const shareIcon =
    guide.share_type === 'public' ? <Globe size={10} /> :
    guide.share_type === 'workspace' ? <Users size={10} /> :
    <Lock size={10} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.45)' }}
      className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 group"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Color accent stripe */}
      <div className="h-1.5 w-full flex-shrink-0" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

      <button className="flex-1 p-5 text-left" onClick={() => onOpen(guide.id)}>
        <div className="flex items-start justify-between mb-4">
          {/* Icon */}
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
              <FileText size={18} style={{ color }} strokeWidth={1.8} />
            </div>
            {/* Video badge */}
            {hasVideo && (
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: '#0b1426', border: `1px solid ${color}40` }}
              >
                {guide.video_type === 'youtube' ? <Youtube size={8} style={{ color }} /> : <Video size={8} style={{ color }} />}
              </div>
            )}
          </div>

          {/* Star + menu */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onUnfavorite(guide.id)}
              title="Remove from favorites"
              className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: '#f59e0b' }}
            >
              <Star size={14} fill="#f59e0b" />
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
                  className="absolute right-4 top-14 w-44 rounded-xl overflow-hidden z-20 py-1"
                  style={{ background: '#0f1d2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  {menuItems.map(({ label, icon, action, danger, accent }) => (
                    <button
                      key={label}
                      className="w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-white/5 flex items-center gap-2"
                      style={{ color: danger ? '#f87171' : accent ? '#f59e0b' : 'rgba(255,255,255,0.65)' }}
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

        <h3 className="text-sm font-bold text-white mb-1.5 leading-snug line-clamp-2">{guide.title}</h3>

        {guide.description && (
          <p className="text-xs mb-2 line-clamp-1" style={{ color: 'rgba(255,255,255,0.38)' }}>{guide.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {guide.total_steps} step{guide.total_steps !== 1 ? 's' : ''}
          </span>
          {guide.status === 'published' && (
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
              Published
            </span>
          )}
          <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {shareIcon} {guide.share_type}
          </span>
        </div>
      </button>

      <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
          <Clock size={10} /> {timeAgo(guide.updated_at)}
        </span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>{guide.views} views</span>
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function FavoritesEmpty({ onBrowse, onCreate }: { onBrowse: () => void; onCreate: () => void }) {
  const hints = [
    { icon: '⚡', text: 'Star frequently used support workflows' },
    { icon: '📋', text: 'Pin training SOPs for fast access' },
    { icon: '🎯', text: 'Save customer-facing demos to reuse later' },
    { icon: '🔄', text: 'Bookmark onboarding guides for your team' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-lg mx-auto"
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,146,60,0.15))', border: '1px solid rgba(245,158,11,0.25)' }}
      >
        <Star size={32} style={{ color: '#f59e0b' }} />
      </div>

      <h2 className="text-2xl font-black text-white mb-3">No favorites yet</h2>
      <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Save important guides, SOPs, and workflow walkthroughs here for instant access.
        Click the <Star size={12} className="inline mx-0.5" style={{ color: '#f59e0b' }} /> star on any guide to add it.
      </p>

      <div className="flex items-center gap-3 mb-10 flex-wrap justify-center">
        <button
          onClick={onBrowse}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
        >
          <LayoutDashboard size={15} /> Browse Guides
        </button>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.18)' }}
        >
          <Plus size={15} /> Create New Guide
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        {hints.map(({ icon, text }) => (
          <div key={text} className="rounded-xl px-4 py-3 text-left" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-base">{icon}</span>
            <p className="text-xs mt-1 leading-snug" style={{ color: 'rgba(255,255,255,0.45)' }}>{text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FavoritesSkeleton() {
  return (
    <div className="px-6 py-8 max-w-6xl mx-auto animate-pulse">
      <div className="h-10 w-48 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-4 w-72 rounded-lg mb-8" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const FavoritesPage = () => {
  const navigate = useNavigate();
  const { token: authToken, user } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteGuide[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('updated');
  const [filter, setFilter] = useState<FilterKey>('all');

  const load = async (quiet = false) => {
    if (!token) return;
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const res = await api.getFavorites(token);
      setFavorites(res.favorites || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUnfavorite = async (guideId: string) => {
    if (!token) return;
    // Optimistic remove
    setFavorites((prev) => prev.filter((g) => g.id !== guideId));
    await api.removeFavorite(token, guideId).catch(() => load(true));
  };

  const handleShare = async (guideId: string) => {
    if (!token) return;
    await api.shareGuide(token, guideId, { shareType: 'workspace', publish: true }).catch(() => {});
    await load(true);
  };

  const handleDuplicate = async (guideId: string) => {
    if (!token) return;
    await api.duplicateGuide(token, guideId).catch(() => {});
    navigate('/dashboard');
  };

  // ─── Filtering + sorting ───────────────────────────────────────────────────

  const displayed = favorites
    .filter((g) => {
      if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'published') return g.status === 'published';
      if (filter === 'draft') return g.status === 'draft';
      if (filter === 'video') return Boolean(g.video_type);
      return true;
    })
    .sort((a, b) => {
      if (sort === 'views') return b.views - a.views;
      if (sort === 'alpha') return a.title.localeCompare(b.title);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const filterOptions: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'published', label: 'Published' },
    { key: 'draft', label: 'Drafts' },
    { key: 'video', label: 'Has Video' },
  ];

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'updated', label: 'Recently updated' },
    { key: 'views', label: 'Most viewed' },
    { key: 'alpha', label: 'A – Z' },
  ];

  const isEmpty = !loading && favorites.length === 0;
  const noResults = !loading && favorites.length > 0 && displayed.length === 0;

  return (
    <AppShell
      workspaceName={user?.team_name || null}
      primaryCtaLabel="New Guide"
      primaryCtaHighlighted={false}
      onNewGuide={() => navigate('/dashboard')}
    >
      <div className="px-6 py-8 max-w-6xl mx-auto">

        {loading && <FavoritesSkeleton />}

        {!loading && error && (
          <div className="rounded-2xl p-6 flex items-start gap-4" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)' }}>
            <AlertCircle size={20} style={{ color: '#f87171', flexShrink: 0 }} />
            <div>
              <p className="text-sm font-semibold text-white">Failed to load favorites</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{error}</p>
              <button onClick={() => load()} className="text-xs mt-2 underline" style={{ color: '#60a5fa' }}>Retry</button>
            </div>
          </div>
        )}

        {!loading && !error && isEmpty && (
          <FavoritesEmpty
            onBrowse={() => navigate('/dashboard')}
            onCreate={() => navigate('/dashboard')}
          />
        )}

        {!loading && !error && !isEmpty && (
          <>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mb-8">
              <div className="flex items-center gap-3 mb-1">
                <Star size={22} style={{ color: '#f59e0b' }} fill="#f59e0b" />
                <h1 className="text-3xl font-black text-white">Favorites</h1>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
                >
                  {favorites.length}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Your saved guides, SOPs, and workflow walkthroughs
              </p>
            </motion.div>

            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="flex flex-wrap items-center gap-3 mb-6"
            >
              {/* Search */}
              <div className="relative flex-1 min-w-48 max-w-64">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search favorites…"
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1.5">
                {filterOptions.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: filter === key ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.05)',
                      color: filter === key ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                      border: `1px solid ${filter === key ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              >
                {sortOptions.map(({ key, label }) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </motion.div>

            {/* No results from filter/search */}
            {noResults && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <Search size={28} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                <p className="text-sm font-semibold text-white mb-1">No matching favorites</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>Try a different search term or filter</p>
                <button onClick={() => { setSearch(''); setFilter('all'); }} className="text-xs mt-3" style={{ color: '#60a5fa' }}>Clear filters</button>
              </motion.div>
            )}

            {/* Cards grid */}
            {!noResults && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {displayed.map((guide, i) => (
                      <FavoriteCard
                        key={guide.id}
                        guide={guide}
                        color={CARD_COLORS[i % CARD_COLORS.length]}
                        onOpen={(id) => navigate(`/guides/${id}`)}
                        onShare={handleShare}
                        onDuplicate={handleDuplicate}
                        onUnfavorite={handleUnfavorite}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Footer count */}
                <p className="text-center text-xs mt-8" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {displayed.length} of {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Unfavorite helper toast feedback via Trash2 in cards */}
    </AppShell>
  );
};
