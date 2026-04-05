import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Crown,
  Eye,
  FileText,
  Globe,
  Lock,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Star,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import {
  api,
  type GuideCard,
  type MemberRole,
  type PendingInvite,
  type WorkspaceActivity,
  type WorkspaceMember,
} from '../lib/api';

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

const CARD_COLORS = ['#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fb923c', '#38bdf8', '#e879f9', '#facc15'];

const ROLE_CONFIG: Record<MemberRole, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  admin: { label: 'Admin', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <Crown size={11} /> },
  editor: { label: 'Editor', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: <Shield size={11} /> },
  viewer: { label: 'Viewer', color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)', icon: <Eye size={11} /> },
};

function RoleBadge({ role }: { role: MemberRole }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

function Avatar({ name, avatarUrl, size = 36 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const hue = name.charCodeAt(0) * 17 % 360;

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `hsl(${hue},55%,45%)` }}
    >
      {initials}
    </div>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({
  open,
  onClose,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: MemberRole) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('editor');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setEmail(''); setRole('editor'); setError(''); setSaving(false); }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onInvite(email.trim(), role);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/65" onClick={onClose} />
          <motion.form
            onSubmit={handleSubmit}
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-sm rounded-2xl p-6"
            style={{ background: '#0b1426', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2"><UserPlus size={16} className="text-blue-400" /> Invite member</h3>
              <button type="button" onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.07)' }}>
                <X size={13} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  autoFocus
                  required
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['admin', 'editor', 'viewer'] as MemberRole[]).map((r) => {
                    const cfg = ROLE_CONFIG[r];
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: role === r ? cfg.bg : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${role === r ? cfg.color + '55' : 'rgba(255,255,255,0.08)'}`,
                          color: role === r ? cfg.color : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        <span style={{ color: role === r ? cfg.color : 'rgba(255,255,255,0.3)' }}>{cfg.icon}</span>
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {role === 'admin' ? 'Full access — can manage members and all guides' : role === 'editor' ? 'Can create and edit guides, cannot manage members' : 'Read-only access to shared guides'}
                </p>
              </div>
              {error && <p className="text-xs" style={{ color: '#fca5a5' }}>{error}</p>}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="submit"
                disabled={saving || !email.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
              >
                {saving ? 'Sending…' : 'Send Invite'}
              </button>
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.12)' }}>
                Cancel
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-2xl"
      style={{ background: 'rgba(15,23,42,0.96)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(12px)' }}
    >
      <Check size={14} className="text-emerald-400" /> {message}
    </motion.div>
  );
}

// ─── Guide Card ───────────────────────────────────────────────────────────────

function TeamGuideCard({
  guide,
  color,
  myRole,
  onOpen,
  onFavorite,
}: {
  guide: GuideCard;
  color: string;
  myRole: MemberRole;
  onOpen: (id: string) => void;
  onFavorite: (id: string, current: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isFav = Boolean(guide.is_favorite);

  const shareIcon = guide.share_type === 'public' ? <Globe size={10} /> : guide.share_type === 'workspace' ? <Users size={10} /> : <Lock size={10} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}
      className="relative flex flex-col rounded-2xl overflow-hidden group transition-all duration-200"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="h-1.5 w-full flex-shrink-0" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

      <button className="flex-1 p-5 text-left" onClick={() => onOpen(guide.id)}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
            <FileText size={18} style={{ color }} strokeWidth={1.8} />
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onFavorite(guide.id, isFav)}
              className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: isFav ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}
            >
              <Star size={14} fill={isFav ? '#f59e0b' : 'none'} />
            </button>
            {(myRole === 'admin' || myRole === 'editor') && (
              <div className="relative">
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
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 top-8 w-36 rounded-xl overflow-hidden z-20 py-1"
                      style={{ background: '#0f1d2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                      onMouseLeave={() => setMenuOpen(false)}
                    >
                      <button className="w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.65)' }} onClick={() => { onOpen(guide.id); setMenuOpen(false); }}>
                        <FileText size={11} /> Open
                      </button>
                      <button className="w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.65)' }} onClick={() => { onFavorite(guide.id, isFav); setMenuOpen(false); }}>
                        <Star size={11} /> {isFav ? 'Unfavorite' : 'Favorite'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <h3 className="text-sm font-bold text-white mb-1.5 leading-snug line-clamp-2">{guide.title}</h3>

        {guide.description && (
          <p className="text-xs mb-2 line-clamp-1" style={{ color: 'rgba(255,255,255,0.38)' }}>{guide.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{guide.total_steps} step{guide.total_steps !== 1 ? 's' : ''}</span>
          {guide.status === 'published' && (
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>Published</span>
          )}
          <span className="flex items-center gap-1 text-xs capitalize" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {shareIcon} {guide.share_type}
          </span>
        </div>
      </button>

      <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
          <Clock size={10} /> {timeAgo(guide.updated_at)}
        </span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>{guide.views} views</span>
      </div>
    </motion.div>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({
  member,
  isMe,
  myRole,
  workspaceOwnerId,
  onChangeRole,
  onRemove,
}: {
  member: WorkspaceMember;
  isMe: boolean;
  myRole: MemberRole;
  workspaceOwnerId: string;
  onChangeRole: (userId: string, role: MemberRole) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}) {
  const [roleOpen, setRoleOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const isOwner = member.user_id === workspaceOwnerId;
  const canManage = myRole === 'admin' && !isMe && !isOwner;

  const handleRole = async (role: MemberRole) => {
    setRoleOpen(false);
    if (role === member.role) return;
    setSaving(true);
    try { await onChangeRole(member.user_id, role); } finally { setSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl group transition-colors hover:bg-white/4"
    >
      <Avatar name={member.name} avatarUrl={member.avatar_url} size={36} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white truncate">{member.name}</p>
          {isMe && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>You</span>}
          {isOwner && <span className="text-xs flex items-center gap-0.5" style={{ color: '#f59e0b' }}><Crown size={10} /> Owner</span>}
        </div>
        <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>{member.email}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {canManage ? (
          <div className="relative">
            <button
              onClick={() => setRoleOpen((o) => !o)}
              disabled={saving}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: ROLE_CONFIG[member.role].bg, color: ROLE_CONFIG[member.role].color, border: `1px solid ${ROLE_CONFIG[member.role].color}30` }}
            >
              {ROLE_CONFIG[member.role].icon}
              {ROLE_CONFIG[member.role].label}
              <ChevronDown size={10} />
            </button>
            <AnimatePresence>
              {roleOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-8 w-36 rounded-xl overflow-hidden z-20 py-1"
                  style={{ background: '#0f1d2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 28px rgba(0,0,0,0.5)' }}
                  onMouseLeave={() => setRoleOpen(false)}
                >
                  {(['admin', 'editor', 'viewer'] as MemberRole[]).map((r) => (
                    <button key={r} onClick={() => handleRole(r)} className="w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-white/5 transition-colors" style={{ color: r === member.role ? ROLE_CONFIG[r].color : 'rgba(255,255,255,0.65)' }}>
                      {r === member.role && <Check size={10} />}
                      {ROLE_CONFIG[r].icon} {ROLE_CONFIG[r].label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <RoleBadge role={member.role} />
        )}

        {canManage && (
          <button
            onClick={() => onRemove(member.user_id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)' }}
            title="Remove member"
          >
            <UserMinus size={13} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Activity Item ────────────────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  guide_created: <FileText size={14} style={{ color: '#f472b6' }} />,
  guide_edited: <FileText size={14} style={{ color: '#a78bfa' }} />,
  guide_viewed: <Eye size={14} style={{ color: '#60a5fa' }} />,
  guide_shared: <Users size={14} style={{ color: '#34d399' }} />,
  guide_published: <Globe size={14} style={{ color: '#fb923c' }} />,
  member_joined: <UserCheck size={14} style={{ color: '#34d399' }} />,
  workspace_created: <Zap size={14} style={{ color: '#f59e0b' }} />,
};

function ActivityItem({ item }: { item: WorkspaceActivity }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-white/4 transition-colors"
    >
      <div className="mt-0.5 flex-shrink-0">
        {ACTIVITY_ICONS[item.type] || <Activity size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white leading-snug">{item.text}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{timeAgo(item.created_at)}</p>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TeamSkeleton() {
  return (
    <div className="px-6 py-8 max-w-6xl mx-auto animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-56 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-4 w-80 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-9 w-32 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-44 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
        </div>
      </div>
    </div>
  );
}

// ─── No Workspace Empty State ─────────────────────────────────────────────────

function NoWorkspace({ onNavigate }: { onNavigate: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(139,92,246,0.25)' }}>
        <Users size={32} style={{ color: '#a78bfa' }} />
      </div>
      <h2 className="text-2xl font-black text-white mb-3">No team yet</h2>
      <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Create a workspace to collaborate with teammates, share guides, and build your team's knowledge base.
      </p>
      <button
        onClick={onNavigate}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
      >
        <Plus size={16} /> Create Workspace
      </button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type GuideFilter = 'all' | 'shared' | 'mine' | 'published';
type GuideSort = 'updated' | 'views' | 'alpha';

export const TeamPage = () => {
  const navigate = useNavigate();
  const { token: authToken, user: authUser } = useAuth();
  const token = authToken ?? authStore.getToken();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<{ id: string; name: string; owner_id: string } | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [guides, setGuides] = useState<GuideCard[]>([]);
  const [activity, setActivity] = useState<WorkspaceActivity[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [myRole, setMyRole] = useState<MemberRole>('viewer');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'guides' | 'members' | 'activity'>('guides');
  const [guideFilter, setGuideFilter] = useState<GuideFilter>('all');
  const [guideSort, setGuideSort] = useState<GuideSort>('updated');
  const [guideSearch, setGuideSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  const showToast = (msg: string) => setToast(msg);
  const isAdmin = myRole === 'admin';

  const load = async (quiet = false) => {
    if (!token) return;
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const res = await api.getWorkspace(token);
      setWorkspace(res.workspace);
      setMembers(res.members);
      setGuides(res.guides);
      setActivity(res.activity);
      setPendingInvites(res.pendingInvites || []);
      setMyRole(res.myRole || 'viewer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleInvite = async (email: string, role: MemberRole) => {
    if (!token) return;
    await api.inviteMember(token, email, role);
    await load(true);
    showToast(`Invite sent to ${email}`);
  };

  const handleChangeRole = async (userId: string, role: MemberRole) => {
    if (!token) return;
    await api.updateMemberRole(token, userId, role);
    await load(true);
    showToast('Role updated');
  };

  const handleRemoveMember = async (userId: string) => {
    if (!token) return;
    const member = members.find((m) => m.user_id === userId);
    if (!window.confirm(`Remove ${member?.name || 'this member'} from the workspace?`)) return;
    await api.removeMember(token, userId);
    await load(true);
    showToast('Member removed');
  };

  const handleFavorite = async (guideId: string, isFav: boolean) => {
    if (!token) return;
    if (isFav) {
      await api.removeFavorite(token, guideId);
      setGuides((prev) => prev.map((g) => g.id === guideId ? { ...g, is_favorite: false } : g));
      showToast('Removed from favorites');
    } else {
      await api.addFavorite(token, guideId);
      setGuides((prev) => prev.map((g) => g.id === guideId ? { ...g, is_favorite: true } : g));
      showToast('Added to favorites');
    }
  };

  // ─── Derived ────────────────────────────────────────────────────────────────

  const filteredGuides = guides
    .filter((g) => {
      if (guideSearch && !g.title.toLowerCase().includes(guideSearch.toLowerCase())) return false;
      if (guideFilter === 'shared') return g.share_type !== 'private';
      if (guideFilter === 'mine') return g.owner_user_id === authUser?.id;
      if (guideFilter === 'published') return g.status === 'published';
      return true;
    })
    .sort((a, b) => {
      if (guideSort === 'views') return b.views - a.views;
      if (guideSort === 'alpha') return a.title.localeCompare(b.title);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const filteredMembers = memberSearch
    ? members.filter((m) => m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.email.toLowerCase().includes(memberSearch.toLowerCase()))
    : members;

  // Stats
  const publishedCount = guides.filter((g) => g.status === 'published').length;
  const sharedCount = guides.filter((g) => g.share_type !== 'private').length;
  const totalViews = guides.reduce((sum, g) => sum + g.views, 0);
  const mostViewed = guides.reduce((best, g) => (!best || g.views > best.views ? g : best), null as GuideCard | null);

  const stats = [
    { label: 'Team Guides', value: guides.length, icon: <FileText size={16} className="text-blue-400" />, color: '#3b82f6' },
    { label: 'Members', value: members.length, icon: <Users size={16} className="text-purple-400" />, color: '#8b5cf6' },
    { label: 'Total Views', value: totalViews, icon: <Eye size={16} className="text-emerald-400" />, color: '#34d399' },
    { label: 'Published', value: publishedCount, icon: <Globe size={16} className="text-orange-400" />, color: '#fb923c' },
  ];

  if (loading) return (
    <AppShell workspaceName={authUser?.team_name || null} primaryCtaLabel="New Guide" primaryCtaHighlighted={false} onNewGuide={() => navigate('/dashboard')}>
      <TeamSkeleton />
    </AppShell>
  );

  if (!workspace && !error) return (
    <AppShell workspaceName={null} primaryCtaLabel="Create Workspace" primaryCtaHighlighted onNewGuide={() => navigate('/onboarding/team')}>
      <NoWorkspace onNavigate={() => navigate('/onboarding/team')} />
    </AppShell>
  );

  return (
    <AppShell workspaceName={workspace?.name || authUser?.team_name || null} primaryCtaLabel="New Guide" primaryCtaHighlighted={false} onNewGuide={() => navigate('/dashboard')}>
      <div className="px-6 py-8 max-w-6xl mx-auto">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex items-start justify-between gap-4 mb-7 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(139,92,246,0.25)' }}>
                <Users size={18} style={{ color: '#a78bfa' }} />
              </div>
              <h1 className="text-3xl font-black text-white">{workspace?.name || 'Team Workspace'}</h1>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Collaborate, share, and manage workflows together · <span style={{ color: 'rgba(255,255,255,0.28)' }}>{members.length} member{members.length !== 1 ? 's' : ''}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <button
                onClick={() => setInviteOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <UserPlus size={14} /> Invite Member
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              <Plus size={14} /> New Guide
            </button>
          </div>
        </motion.div>

        {/* ── Error banner ── */}
        {error && (
          <div className="rounded-2xl p-4 flex items-center gap-3 mb-6" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)' }}>
            <AlertCircle size={18} style={{ color: '#f87171' }} />
            <p className="text-sm text-white">{error}</p>
            <button onClick={() => load()} className="ml-auto text-xs underline" style={{ color: '#60a5fa' }}>Retry</button>
          </div>
        )}

        {/* ── Stats row ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {stats.map(({ label, value, icon, color }) => (
            <div key={label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                  {icon}
                </div>
                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
              </div>
              <p className="text-2xl font-black text-white">{value.toLocaleString()}</p>
              {label === 'Team Guides' && sharedCount > 0 && (
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{sharedCount} shared</p>
              )}
              {label === 'Team Guides' && mostViewed && (
                <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>Top: {mostViewed.title}</p>
              )}
            </div>
          ))}
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {([
            { key: 'guides', label: 'Guides', count: guides.length },
            { key: 'members', label: 'Members', count: members.length },
            { key: 'activity', label: 'Activity', count: activity.length },
          ] as { key: typeof activeTab; label: string; count: number }[]).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: activeTab === key ? 'rgba(59,130,246,0.2)' : 'transparent',
                color: activeTab === key ? '#fff' : 'rgba(255,255,255,0.45)',
                border: `1px solid ${activeTab === key ? 'rgba(59,130,246,0.35)' : 'transparent'}`,
              }}
            >
              {label}
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: activeTab === key ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)', color: activeTab === key ? '#93c5fd' : 'rgba(255,255,255,0.35)' }}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* GUIDES TAB                                                         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {activeTab === 'guides' && (
            <motion.div key="guides" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="relative flex-1 min-w-44 max-w-60">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    value={guideSearch}
                    onChange={(e) => setGuideSearch(e.target.value)}
                    placeholder="Search guides…"
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  {([
                    { key: 'all', label: 'All' },
                    { key: 'shared', label: 'Shared' },
                    { key: 'mine', label: 'Mine' },
                    { key: 'published', label: 'Published' },
                  ] as { key: GuideFilter; label: string }[]).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setGuideFilter(key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: guideFilter === key ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                        color: guideFilter === key ? '#60a5fa' : 'rgba(255,255,255,0.45)',
                        border: `1px solid ${guideFilter === key ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <select
                  value={guideSort}
                  onChange={(e) => setGuideSort(e.target.value as GuideSort)}
                  className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}
                >
                  <option value="updated">Recently updated</option>
                  <option value="views">Most viewed</option>
                  <option value="alpha">A – Z</option>
                </select>
              </div>

              {filteredGuides.length === 0 ? (
                <div className="py-16 text-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <FileText size={28} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                  <p className="text-sm font-semibold text-white mb-1">{guideSearch || guideFilter !== 'all' ? 'No matching guides' : 'No guides yet'}</p>
                  <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {guideSearch || guideFilter !== 'all' ? 'Try a different filter or search term' : 'Create your first team guide to get started'}
                  </p>
                  {!guideSearch && guideFilter === 'all' && (
                    <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                      <Plus size={13} /> Create Guide
                    </button>
                  )}
                  {(guideSearch || guideFilter !== 'all') && (
                    <button onClick={() => { setGuideSearch(''); setGuideFilter('all'); }} className="text-xs underline" style={{ color: '#60a5fa' }}>Clear filters</button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {filteredGuides.map((guide, i) => (
                      <TeamGuideCard
                        key={guide.id}
                        guide={guide}
                        color={CARD_COLORS[i % CARD_COLORS.length]}
                        myRole={myRole}
                        onOpen={(id) => navigate(`/guides/${id}`)}
                        onFavorite={handleFavorite}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* MEMBERS TAB                                                        */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'members' && (
            <motion.div key="members" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-64">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members…"
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setInviteOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold ml-auto"
                    style={{ color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <UserPlus size={14} /> Invite
                  </button>
                )}
              </div>

              {/* Active members */}
              <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Active Members ({filteredMembers.length})</span>
                </div>
                <div className="p-2 space-y-0.5">
                  <AnimatePresence>
                    {filteredMembers.map((member) => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        isMe={member.user_id === authUser?.id}
                        myRole={myRole}
                        workspaceOwnerId={workspace?.owner_id || ''}
                        onChangeRole={handleChangeRole}
                        onRemove={handleRemoveMember}
                      />
                    ))}
                  </AnimatePresence>
                  {filteredMembers.length === 0 && (
                    <div className="py-6 text-center">
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No members match your search</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pending invites */}
              {pendingInvites.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Pending Invites ({pendingInvites.length})</span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    {pendingInvites.map((invite) => (
                      <div key={invite.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <UserPlus size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{invite.email}</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Invited {timeAgo(invite.invited_at)}</p>
                        </div>
                        <RoleBadge role={invite.role} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Permission reference */}
              <div className="mt-5 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Role Permissions</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['admin', 'editor', 'viewer'] as MemberRole[]).map((role) => {
                    const cfg = ROLE_CONFIG[role];
                    const perms = {
                      admin: ['Create & edit guides', 'Manage members', 'Change roles', 'Delete any guide', 'Full workspace access'],
                      editor: ['Create & edit guides', 'Share guides', 'Cannot manage members'],
                      viewer: ['View shared guides', 'Read-only access'],
                    }[role];
                    return (
                      <div key={role} className="rounded-xl p-3" style={{ background: cfg.bg, border: `1px solid ${cfg.color}25` }}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span style={{ color: cfg.color }}>{cfg.icon}</span>
                          <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                        </div>
                        <ul className="space-y-1">
                          {perms.map((p) => (
                            <li key={p} className="text-xs flex items-start gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                              <span className="mt-0.5 flex-shrink-0" style={{ color: cfg.color }}>·</span> {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ACTIVITY TAB                                                       */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'activity' && (
            <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {activity.length === 0 ? (
                <div className="py-16 text-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Activity size={28} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                  <p className="text-sm font-semibold text-white mb-1">No activity yet</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Team activity will appear here as guides are created, shared, and viewed</p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Recent Activity ({activity.length})</span>
                  </div>
                  <div className="p-2">
                    <AnimatePresence>
                      {activity.map((item) => <ActivityItem key={item.id} item={item} />)}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Invite Modal ── */}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={handleInvite} />

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && <Toast key={toast} message={toast} onDismiss={() => setToast('')} />}
      </AnimatePresence>
    </AppShell>
  );
};
