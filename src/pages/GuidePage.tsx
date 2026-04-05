import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Copy,
  Edit3,
  Eye,
  FileText,
  Globe,
  Link2,
  Lock,
  MoreHorizontal,
  Pencil,
  Play,
  PlayCircle,
  Plus,
  Radio,
  Share2,
  Trash2,
  Upload,
  Users,
  Video,
  X,
  Youtube,
  Zap,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { authStore } from '../lib/auth';
import { api, type GuideCard, type GuideStep, type ShareSettings } from '../lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeAgo = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(ms / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 30 ? `${days}d ago` : `${Math.floor(days / 30)}mo ago`;
};

const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const normalizeImageUrl = (value: string | null | undefined) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/uploads/')) {
    const devApiBase = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL;
    const fallbackBase = window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;
    const base = (devApiBase && devApiBase.trim()) || fallbackBase;
    return `${base}${value}`;
  }
  return value;
};

const extractYouTubeId = (url: string) => {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
};

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
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-2xl"
      style={{ background: 'rgba(15,23,42,0.96)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(12px)' }}
    >
      <Check size={14} className="text-emerald-400" /> {message}
    </motion.div>
  );
}

// ─── Recording Banner ─────────────────────────────────────────────────────────

function RecordingBanner({
  stepCount,
  onAddStep,
  onStop,
  saving,
}: {
  stepCount: number;
  onAddStep: () => void;
  onStop: () => void;
  saving: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center justify-between px-5 py-3 rounded-2xl mb-5"
      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}
    >
      <div className="flex items-center gap-3">
        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
          <Radio size={14} className="text-red-400" />
        </motion.div>
        <span className="text-sm font-semibold text-white">Recording</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>
          {stepCount} step{stepCount !== 1 ? 's' : ''} captured
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAddStep}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
          style={{ background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(59,130,246,0.4)' }}
        >
          <Plus size={12} /> Capture Step
        </button>
        <button
          onClick={onStop}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
          style={{ background: saving ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.35)' }}
        >
          {saving ? 'Saving…' : 'Stop Recording'}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Record / Add Video Modal ─────────────────────────────────────────────────

type RecordModalTab = 'record' | 'upload' | 'youtube';

function RecordModal({
  open,
  onClose,
  onStartRecording,
  onUploadVideo,
  onAddYouTube,
}: {
  open: boolean;
  onClose: () => void;
  onStartRecording: () => void;
  onUploadVideo: (file: File) => Promise<void>;
  onAddYouTube: (url: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<RecordModalTab>('record');
  const [ytUrl, setYtUrl] = useState('');
  const [ytError, setYtError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (open) { setTab('record'); setYtUrl(''); setYtError(''); setSaving(false); setUploading(false); setUploadProgress(0); }
  }, [open]);

  const handleYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    setYtError('');
    if (!extractYouTubeId(ytUrl)) { setYtError('Paste a valid YouTube URL (watch?v=... or youtu.be/...)'); return; }
    setSaving(true);
    try {
      await onAddYouTube(ytUrl.trim());
      onClose();
    } catch (err) {
      setYtError(err instanceof Error ? err.message : 'Failed to add video');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(10);
    try {
      // Simulate progress ticks during upload
      const ticker = setInterval(() => setUploadProgress((p) => Math.min(p + 8, 88)), 400);
      await onUploadVideo(file);
      clearInterval(ticker);
      setUploadProgress(100);
      setTimeout(() => onClose(), 300);
    } catch {
      setUploadProgress(0);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const tabs: { id: RecordModalTab; icon: React.ReactNode; label: string; desc: string }[] = [
    { id: 'record', icon: <Radio size={16} className="text-red-400" />, label: 'Record screen', desc: 'Capture a live workflow recording' },
    { id: 'upload', icon: <Upload size={16} className="text-blue-400" />, label: 'Upload video', desc: 'MP4, WebM or MOV file' },
    { id: 'youtube', icon: <Youtube size={16} className="text-red-400" />, label: 'YouTube link', desc: 'Paste a YouTube video URL' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/65" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-md rounded-2xl p-6"
            style={{ background: '#0b1426', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">Add video to guide</h3>
              <button type="button" onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.07)' }}>
                <X size={13} />
              </button>
            </div>

            {/* Tab selector */}
            <div className="space-y-2 mb-5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: tab === t.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${tab === t.id ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {t.icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.7)' }}>{t.label}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{t.desc}</p>
                  </div>
                  {tab === t.id && <Check size={13} className="text-blue-400 flex-shrink-0" />}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'record' && (
              <button
                onClick={() => { onStartRecording(); onClose(); }}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.4)' }}
              >
                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                  <Radio size={14} className="text-red-400" />
                </motion.div>
                Start recording workflow
              </button>
            )}

            {tab === 'upload' && (
              <div>
                {uploading ? (
                  <div className="space-y-3">
                    <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>Uploading video…</p>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>{uploadProgress}%</p>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-3 px-4 py-6 rounded-xl cursor-pointer transition-colors hover:bg-white/5"
                    style={{ border: '2px dashed rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.04)' }}
                  >
                    <Upload size={24} className="text-blue-400" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">Click to upload video</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>MP4, WebM, MOV · up to 500 MB</p>
                    </div>
                    <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" className="hidden" onChange={handleFileChange} />
                  </label>
                )}
              </div>
            )}

            {tab === 'youtube' && (
              <form onSubmit={handleYouTube} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>YouTube URL</label>
                  <input
                    value={ytUrl}
                    onChange={(e) => { setYtUrl(e.target.value); setYtError(''); }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${ytError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}` }}
                  />
                  {ytError && <p className="text-xs mt-1" style={{ color: '#fca5a5' }}>{ytError}</p>}
                </div>
                <button
                  type="submit"
                  disabled={saving || !ytUrl.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                >
                  {saving ? 'Adding…' : 'Add YouTube video'}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Video Panel ──────────────────────────────────────────────────────────────

function VideoPanel({
  guide,
  onSeek,
  videoRef,
}: {
  guide: GuideCard;
  onSeek?: (secs: number) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}) {
  const [playerReady, setPlayerReady] = useState(false);

  if (!guide.video_type) return null;

  if (guide.video_type === 'youtube' && guide.embed_url) {
    return (
      <div className="rounded-2xl overflow-hidden mb-5" style={{ background: '#000', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ position: 'relative', paddingTop: '56.25%' }}>
          <iframe
            src={guide.embed_url}
            title="Guide video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Youtube size={13} className="text-red-400" />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>YouTube video</span>
          <a
            href={guide.video_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <Link2 size={10} /> Open
          </a>
        </div>
      </div>
    );
  }

  if ((guide.video_type === 'uploaded' || guide.video_type === 'recorded') && guide.video_url) {
    const src = normalizeImageUrl(guide.video_url);
    return (
      <div className="rounded-2xl overflow-hidden mb-5" style={{ background: '#000', border: '1px solid rgba(255,255,255,0.08)' }}>
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          src={src}
          controls
          className="w-full"
          style={{ maxHeight: 380, display: 'block', background: '#000' }}
          onLoadedMetadata={() => setPlayerReady(true)}
        />
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Video size={13} className="text-blue-400" />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {guide.video_type === 'recorded' ? 'Screen recording' : 'Uploaded video'}
            {guide.duration_seconds ? ` · ${formatDuration(guide.duration_seconds)}` : ''}
          </span>
          {playerReady && onSeek && (
            <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Click a step to jump</span>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Add / Edit Step Modal ────────────────────────────────────────────────────

interface StepFormData {
  title: string;
  description: string;
  screenshot_url: string;
  video_timestamp_seconds: string;
}

function AddStepModal({
  open,
  initial,
  onClose,
  onSave,
  isRecording,
  token,
  hasVideo,
}: {
  open: boolean;
  initial?: Partial<StepFormData> & { id?: string };
  onClose: () => void;
  onSave: (data: StepFormData) => Promise<void>;
  isRecording: boolean;
  token: string | null;
  hasVideo: boolean;
}) {
  const [form, setForm] = useState<StepFormData>({ title: '', description: '', screenshot_url: '', video_timestamp_seconds: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm({
        title: initial?.title || '',
        description: initial?.description || '',
        screenshot_url: initial?.screenshot_url || '',
        video_timestamp_seconds: initial?.video_timestamp_seconds || '',
      });
      setTimeout(() => titleRef.current?.focus(), 80);
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isEditing = Boolean(initial?.id);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/65" onClick={onClose} />
          <motion.form
            onSubmit={handleSubmit}
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-md rounded-2xl p-6"
            style={{ background: '#0b1426', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Edit step' : isRecording ? 'Capture step' : 'Add step'}
              </h3>
              <button type="button" onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.07)' }}>
                <X size={13} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Step title *</label>
                <input
                  ref={titleRef}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Click the Submit button"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What happens in this step?"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Screenshot URL <span style={{ color: 'rgba(255,255,255,0.28)' }}>(optional)</span></label>
                <input
                  value={form.screenshot_url}
                  onChange={(e) => setForm((f) => ({ ...f, screenshot_url: e.target.value }))}
                  placeholder="https://..."
                  type="url"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
                <div className="mt-2 flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer" style={{ color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.18)' }}>
                    <Upload size={12} /> {uploading ? 'Uploading…' : 'Upload image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading || !token}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !token) return;
                        setUploading(true);
                        try {
                          const uploaded = await api.uploadImage(token, file);
                          setForm((f) => ({ ...f, screenshot_url: uploaded.url }));
                        } finally {
                          setUploading(false);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </label>
                  {form.screenshot_url ? (
                    <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>Image attached</span>
                  ) : null}
                </div>
              </div>

              {hasVideo && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Video timestamp <span style={{ color: 'rgba(255,255,255,0.28)' }}>(seconds, optional)</span>
                  </label>
                  <input
                    value={form.video_timestamp_seconds}
                    onChange={(e) => setForm((f) => ({ ...f, video_timestamp_seconds: e.target.value }))}
                    placeholder="e.g. 84 (for 1:24)"
                    type="number"
                    min="0"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>Clicking this step will jump the video to this time</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-5">
              <button
                type="submit"
                disabled={saving || uploading || !form.title.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
              >
                {saving || uploading ? 'Saving…' : isEditing ? 'Save changes' : isRecording ? 'Capture step' : 'Add step'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                Cancel
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Share Modal ──────────────────────────────────────────────────────────────

function ShareModal({
  open,
  guide,
  share,
  token,
  onClose,
  onUpdate,
  onToast,
}: {
  open: boolean;
  guide: GuideCard;
  share: ShareSettings | null;
  token: string;
  onClose: () => void;
  onUpdate: (g: GuideCard, s: ShareSettings) => void;
  onToast: (msg: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<'private' | 'workspace' | 'public'>(share?.share_type || 'private');
  const [publish, setPublish] = useState(guide.status === 'published');

  useEffect(() => {
    if (open) {
      setSelected(share?.share_type || 'private');
      setPublish(guide.status === 'published');
    }
  }, [open, share, guide.status]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.shareGuide(token, guide.id, { shareType: selected, publish });
      onUpdate(res.guide, res.share);
      if (selected === 'public' && res.share_url) {
        await navigator.clipboard.writeText(res.share_url).catch(() => {});
        onToast('Link copied to clipboard');
      } else {
        onToast('Sharing settings saved');
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const options: { type: 'private' | 'workspace' | 'public'; icon: React.ReactNode; label: string; desc: string }[] = [
    { type: 'private', icon: <Lock size={14} />, label: 'Private', desc: 'Only you can view this guide' },
    { type: 'workspace', icon: <Users size={14} />, label: 'Workspace', desc: 'Everyone in your workspace' },
    { type: 'public', icon: <Globe size={14} />, label: 'Public link', desc: 'Anyone with the link can view' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/65" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-sm rounded-2xl p-6"
            style={{ background: '#0b1426', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Share guide</h3>
              <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.07)' }}>
                <X size={13} />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {options.map(({ type, icon, label, desc }) => (
                <button
                  key={type}
                  onClick={() => setSelected(type)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    background: selected === type ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${selected === type ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <div style={{ color: selected === type ? '#60a5fa' : 'rgba(255,255,255,0.4)' }}>{icon}</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: selected === type ? '#fff' : 'rgba(255,255,255,0.7)' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>
                  </div>
                  {selected === type && <Check size={13} className="ml-auto text-blue-400" />}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div
                onClick={() => setPublish((p) => !p)}
                className="w-9 h-5 rounded-full transition-colors relative flex-shrink-0"
                style={{ background: publish ? '#3b82f6' : 'rgba(255,255,255,0.15)' }}
              >
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: publish ? '18px' : '2px' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Published</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>Make guide visible to viewers</p>
              </div>
            </label>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              {saving ? 'Saving…' : selected === 'public' ? 'Save & Copy Link' : 'Save settings'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  onOpenRecordModal,
  onAddManual,
}: {
  onOpenRecordModal: () => void;
  onAddManual: () => void;
}) {
  const useCases = [
    { icon: '🎓', label: 'Employee Training', desc: 'Step-by-step onboarding & skill guides' },
    { icon: '📋', label: 'SOPs', desc: 'Repeatable process documentation' },
    { icon: '🎧', label: 'Customer Support', desc: 'Share exact steps instead of long emails' },
    { icon: '🎯', label: 'Sales Demos', desc: 'Show how your product works visually' },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(139,92,246,0.3)' }}
      >
        <Zap size={24} style={{ color: '#a78bfa' }} />
      </div>
      <h3 className="text-xl font-black text-white mb-2 text-center">No content yet</h3>
      <p className="text-sm text-center max-w-sm mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
        Record a walkthrough, upload a video, add a YouTube link, or add steps manually to build this guide.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <button
          onClick={onOpenRecordModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
        >
          <PlayCircle size={15} /> Add Video or Record
        </button>
        <button
          onClick={onAddManual}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.18)' }}
        >
          <Plus size={15} /> Add Step Manually
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {useCases.map(({ icon, label, desc }) => (
          <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-base mb-1">{icon}</div>
            <p className="text-xs font-semibold text-white mb-0.5">{label}</p>
            <p className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.38)' }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step List Item ───────────────────────────────────────────────────────────

function StepListItem({
  step,
  active,
  isOwner,
  onClick,
  onEdit,
  onDelete,
}: {
  step: GuideStep;
  active: boolean;
  isOwner: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasTimestamp = step.video_timestamp_seconds != null;

  return (
    <div className="relative group flex items-start gap-2 px-3 py-2.5 rounded-xl transition-all"
      style={{ background: active ? 'rgba(59,130,246,0.14)' : 'transparent', border: `1px solid ${active ? 'rgba(59,130,246,0.3)' : 'transparent'}` }}
    >
      <button onClick={onClick} className="flex items-start gap-2 flex-1 text-left min-w-0">
        <div
          className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: active ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : 'rgba(255,255,255,0.08)', color: active ? '#fff' : 'rgba(255,255,255,0.4)' }}
        >
          {step.step_number}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-snug truncate" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}>
            {step.title}
          </p>
          {hasTimestamp && (
            <div className="flex items-center gap-1 mt-0.5">
              <Play size={8} style={{ color: '#60a5fa' }} />
              <span className="text-xs" style={{ color: '#60a5fa' }}>{formatDuration(step.video_timestamp_seconds!)}</span>
            </div>
          )}
        </div>
      </button>

      {isOwner && (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <MoreHorizontal size={11} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-6 w-28 rounded-xl overflow-hidden z-20 py-1"
                style={{ background: '#0f1d2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 28px rgba(0,0,0,0.5)' }}
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button className="w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-white/5 transition-colors" style={{ color: 'rgba(255,255,255,0.65)' }} onClick={() => { onEdit(); setMenuOpen(false); }}>
                  <Pencil size={11} /> Edit
                </button>
                <button className="w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-white/5 transition-colors" style={{ color: '#f87171' }} onClick={() => { onDelete(); setMenuOpen(false); }}>
                  <Trash2 size={11} /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── Step Viewer ──────────────────────────────────────────────────────────────

function StepViewer({
  step,
  totalSteps,
  activeIdx,
  onPrev,
  onNext,
  onDone,
  onSeekVideo,
}: {
  step: GuideStep;
  totalSteps: number;
  activeIdx: number;
  onPrev: () => void;
  onNext: () => void;
  onDone: () => void;
  onSeekVideo?: (secs: number) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = normalizeImageUrl(step.screenshot_url);

  useEffect(() => {
    setImageFailed(false);
  }, [step.id, step.screenshot_url]);

  // Auto-seek video when step changes
  useEffect(() => {
    if (step.video_timestamp_seconds != null && onSeekVideo) {
      onSeekVideo(step.video_timestamp_seconds);
    }
  }, [step.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Screenshot / placeholder */}
        <div className="flex items-center justify-center" style={{ minHeight: 200, background: 'rgba(0,0,0,0.22)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={step.title}
              className="max-w-full max-h-60 object-contain rounded-lg"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2"
                style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)' }}
              >
                <span className="text-2xl font-black" style={{ color: '#60a5fa' }}>{step.step_number}</span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>No screenshot</p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Circle size={12} style={{ color: '#60a5fa' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#60a5fa' }}>Step {step.step_number}</span>
            {step.video_timestamp_seconds != null && onSeekVideo && (
              <button
                onClick={() => onSeekVideo(step.video_timestamp_seconds!)}
                className="ml-auto flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }}
              >
                <Play size={10} /> Jump to {formatDuration(step.video_timestamp_seconds)}
              </button>
            )}
          </div>
          <h2 className="text-lg font-bold text-white mb-2 leading-snug">{step.title}</h2>
          {step.description && (
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{step.description}</p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            disabled={activeIdx === 0}
            onClick={onPrev}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
            style={{ color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>{activeIdx + 1} / {totalSteps}</span>
          {activeIdx < totalSteps - 1 ? (
            <button
              onClick={onNext}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={onDone}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
            >
              Done <ArrowRight size={14} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const GuidePage = () => {
  const { guideId } = useParams<{ guideId: string }>();
  const navigate = useNavigate();
  const { token: authToken, user: authUser } = useAuth();
  const token = authToken ?? authStore.getToken();

  // Guide data
  const [guide, setGuide] = useState<GuideCard | null>(null);
  const [steps, setSteps] = useState<GuideStep[]>([]);
  const [share, setShare] = useState<ShareSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  // Recording state
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'saving'>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Modals
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [editStep, setEditStep] = useState<GuideStep | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Inline title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Video player ref (for uploaded/recorded videos)
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Toast
  const [toast, setToast] = useState('');
  const showToast = (msg: string) => setToast(msg);

  // ─── Load ──────────────────────────────────────────────────────────────────

  const load = async (quiet = false) => {
    if (!token || !guideId) return;
    if (!quiet) setLoading(true);
    setError('');
    try {
      const res = await api.getGuide(token, guideId);
      setGuide(res.guide);
      setSteps([...res.steps].sort((a, b) => a.step_number - b.step_number));
      setShare(res.share);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load guide');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token, guideId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-record view
  useEffect(() => {
    if (guide && token) {
      api.recordGuideView(token, guide.id).catch(() => {});
    }
  }, [guide?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Derived ───────────────────────────────────────────────────────────────

  const isOwner = guide?.owner_user_id === authUser?.id;
  const currentStep = steps[activeStep] ?? null;
  const progress = steps.length > 0 ? Math.round(((activeStep + 1) / steps.length) * 100) : 0;
  const hasVideo = Boolean(guide?.video_type);

  // ─── Video seek ────────────────────────────────────────────────────────────

  const handleSeekVideo = (secs: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = secs;
      videoRef.current.play().catch(() => {});
    }
    // For YouTube the iframe API would be needed; clicking the jump button is the fallback
  };

  // ─── Title editing ─────────────────────────────────────────────────────────

  const startEditTitle = () => {
    setTitleDraft(guide?.title || '');
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 40);
  };

  const saveTitle = async () => {
    if (!token || !guide || !titleDraft.trim() || titleDraft === guide.title) {
      setEditingTitle(false);
      return;
    }
    try {
      await api.updateGuide(token, guide.id, { title: titleDraft.trim() });
      setGuide((g) => g ? { ...g, title: titleDraft.trim() } : g);
      showToast('Title updated');
    } catch {
      showToast('Failed to update title');
    } finally {
      setEditingTitle(false);
    }
  };

  // ─── Publish toggle ────────────────────────────────────────────────────────

  const handlePublishToggle = async () => {
    if (!token || !guide) return;
    const next = guide.status === 'published' ? 'draft' : 'published';
    try {
      await api.updateGuide(token, guide.id, { status: next });
      setGuide((g) => g ? { ...g, status: next } : g);
      showToast(next === 'published' ? 'Guide published' : 'Guide unpublished');
    } catch {
      showToast('Failed to update status');
    }
  };

  // ─── Step actions ──────────────────────────────────────────────────────────

  const handleAddStep = async (data: StepFormData) => {
    if (!token || !guide) return;
    const tsRaw = data.video_timestamp_seconds.trim();
    await api.guideAddStep(token, guide.id, {
      title: data.title,
      description: data.description,
      screenshot_url: data.screenshot_url || null,
      video_timestamp_seconds: tsRaw !== '' ? parseInt(tsRaw, 10) : null,
    });
    await load(true);
    setActiveStep(steps.length);
    showToast('Step added');
  };

  const handleEditStep = async (data: StepFormData) => {
    if (!token || !guide || !editStep) return;
    const tsRaw = data.video_timestamp_seconds.trim();
    await api.guideUpdateStep(token, guide.id, editStep.id, {
      title: data.title,
      description: data.description,
      screenshot_url: data.screenshot_url || null,
      video_timestamp_seconds: tsRaw !== '' ? parseInt(tsRaw, 10) : null,
    });
    await load(true);
    showToast('Step updated');
  };

  const handleDeleteStep = async (step: GuideStep) => {
    if (!token || !guide) return;
    if (!window.confirm(`Delete step ${step.step_number}: "${step.title}"?`)) return;
    await api.guideDeleteStep(token, guide.id, step.id);
    await load(true);
    setActiveStep((i) => Math.max(0, i - 1));
    showToast('Step deleted');
  };

  // ─── Recording ─────────────────────────────────────────────────────────────

  const handleStartRecording = async () => {
    if (!token || !guide) return;
    try {
      const res = await api.guideStartRecording(token, guide.id);
      setSessionId(res.session.id);
      setRecordingState('recording');
      setAddStepOpen(true);
    } catch {
      showToast('Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!token || !guide) return;
    setRecordingState('saving');
    try {
      await api.guideFinishRecording(token, guide.id, sessionId);
      await load(true);
      showToast('Recording saved');
    } catch {
      showToast('Failed to save recording');
    } finally {
      setRecordingState('idle');
      setSessionId(null);
    }
  };

  const handleCancelRecording = async () => {
    if (!token || !guide) return;
    await api.guideCancelRecording(token, guide.id, sessionId).catch(() => {});
    setRecordingState('idle');
    setSessionId(null);
  };

  // ─── Video upload ──────────────────────────────────────────────────────────

  const handleUploadVideo = async (file: File) => {
    if (!token || !guide) return;
    const res = await api.uploadVideo(token, file);
    await api.updateGuide(token, guide.id, {
      video_type: 'uploaded',
      video_url: res.videoUrl,
      embed_url: null,
      duration_seconds: res.durationSeconds,
    });
    await load(true);
    showToast('Video uploaded');
  };

  // ─── YouTube ───────────────────────────────────────────────────────────────

  const handleAddYouTube = async (url: string) => {
    if (!token || !guide) return;
    const res = await api.guideAddYouTube(token, guide.id, url);
    setGuide((g) => g ? { ...g, video_type: 'youtube', video_url: res.videoUrl, embed_url: res.embedUrl, duration_seconds: null } : g);
    showToast('YouTube video added');
  };

  // ─── Remove video ──────────────────────────────────────────────────────────

  const handleRemoveVideo = async () => {
    if (!token || !guide) return;
    if (!window.confirm('Remove video from this guide?')) return;
    await api.guideRemoveVideo(token, guide.id);
    setGuide((g) => g ? { ...g, video_type: null, video_url: null, embed_url: null, duration_seconds: null } : g);
    showToast('Video removed');
  };

  // ─── Share update callback ─────────────────────────────────────────────────

  const handleShareUpdate = (updatedGuide: GuideCard, updatedShare: ShareSettings) => {
    setGuide(updatedGuide);
    setShare(updatedShare);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppShell workspaceName={null} primaryCtaLabel="New Guide" primaryCtaHighlighted={false} onNewGuide={() => navigate('/dashboard')}>
        <div className="px-6 py-8 max-w-5xl mx-auto animate-pulse">
          <div className="h-8 w-52 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />)}</div>
            <div className="lg:col-span-2 h-80 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !guide) {
    return (
      <AppShell workspaceName={null} primaryCtaLabel="New Guide" primaryCtaHighlighted={false} onNewGuide={() => navigate('/dashboard')}>
        <div className="px-6 py-20 max-w-lg mx-auto text-center">
          <AlertCircle size={28} className="mx-auto mb-4" style={{ color: '#fca5a5' }} />
          <h2 className="text-white text-xl font-bold mb-2">Guide not found</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>{error || 'This guide does not exist or you do not have access.'}</p>
          <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <ChevronLeft size={14} /> Back to dashboard
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell workspaceName={null} primaryCtaLabel="New Guide" primaryCtaHighlighted={false} onNewGuide={() => navigate('/dashboard')}>
      <div className="px-6 py-8 max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-start gap-3 mb-5">
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-1 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors hover:bg-white/8"
            style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex-1 min-w-0">
            {/* Editable title */}
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                className="text-xl font-black text-white bg-transparent outline-none border-b w-full"
                style={{ borderColor: 'rgba(59,130,246,0.6)' }}
              />
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-xl font-black text-white leading-tight truncate">{guide.title}</h1>
                {isOwner && (
                  <button onClick={startEditTitle} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <Edit3 size={13} />
                  </button>
                )}
              </div>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <Clock size={10} /> {timeAgo(guide.updated_at)}
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <Eye size={10} /> {guide.views} views
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <FileText size={10} /> {steps.length} steps
              </span>
              {hasVideo && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {guide.video_type === 'youtube' ? <Youtube size={10} /> : <Video size={10} />}
                  {guide.video_type === 'youtube' ? 'YouTube' : guide.video_type === 'recorded' ? 'Recording' : 'Video'}
                </span>
              )}
              {share && (
                <span className="flex items-center gap-1 text-xs capitalize" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {share.share_type === 'public' ? <Globe size={10} /> : share.share_type === 'workspace' ? <Users size={10} /> : <Lock size={10} />}
                  {share.share_type}
                </span>
              )}
              <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  background: guide.status === 'published' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)',
                  color: guide.status === 'published' ? '#34d399' : 'rgba(255,255,255,0.4)',
                }}
              >
                {guide.status}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            {isOwner && recordingState === 'idle' && (
              <button
                onClick={() => setRecordModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.32)' }}
              >
                <Radio size={12} className="text-red-400" /> Record
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => setAddStepOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.14)' }}
              >
                <Plus size={12} /> Add Step
              </button>
            )}
            {isOwner && hasVideo && (
              <button
                onClick={handleRemoveVideo}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.22)' }}
              >
                <Trash2 size={12} /> Remove Video
              </button>
            )}
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.14)' }}
            >
              <Share2 size={12} /> Share
            </button>
            {isOwner && (
              <button
                onClick={handlePublishToggle}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: guide.status === 'published' ? 'rgba(52,211,153,0.18)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: guide.status === 'published' ? '1px solid rgba(52,211,153,0.3)' : 'none' }}
              >
                {guide.status === 'published' ? <><Check size={12} className="text-emerald-400" /> Published</> : 'Publish'}
              </button>
            )}
            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setMoreOpen((o) => !o)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <MoreHorizontal size={14} />
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 top-10 w-36 rounded-xl overflow-hidden z-20 py-1"
                      style={{ background: '#0f1d2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 28px rgba(0,0,0,0.5)' }}
                      onMouseLeave={() => setMoreOpen(false)}
                    >
                      <button
                        className="w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-white/5 transition-colors"
                        style={{ color: 'rgba(255,255,255,0.65)' }}
                        onClick={async () => { setMoreOpen(false); if (token) { await api.duplicateGuide(token, guide.id); navigate('/dashboard'); } }}
                      >
                        <Copy size={11} /> Duplicate
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-white/5 transition-colors"
                        style={{ color: '#f87171' }}
                        onClick={async () => {
                          setMoreOpen(false);
                          if (!window.confirm('Delete this guide?')) return;
                          if (token) { await api.deleteGuide(token, guide.id); navigate('/dashboard'); }
                        }}
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* ── Recording banner ── */}
        <AnimatePresence>
          {recordingState !== 'idle' && (
            <RecordingBanner
              stepCount={steps.length}
              onAddStep={() => setAddStepOpen(true)}
              onStop={handleStopRecording}
              saving={recordingState === 'saving'}
            />
          )}
        </AnimatePresence>

        {/* ── Video Player (YouTube or uploaded) ── */}
        {hasVideo && (
          <VideoPanel
            guide={guide}
            onSeek={handleSeekVideo}
            videoRef={videoRef}
          />
        )}

        {/* ── Progress bar (shown when steps exist) ── */}
        {steps.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>Step {activeStep + 1} of {steps.length}</span>
              <span className="text-xs font-semibold" style={{ color: '#a78bfa' }}>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* ── Two-column layout ── */}
        {(steps.length > 0 || hasVideo) ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Left: Steps sidebar */}
            <div
              className="lg:col-span-1 rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.38)' }}>Steps ({steps.length})</span>
                {isOwner && (
                  <button
                    onClick={() => setAddStepOpen(true)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    <Plus size={13} />
                  </button>
                )}
              </div>

              <div className="p-2 space-y-0.5 overflow-y-auto" style={{ maxHeight: 480 }}>
                {steps.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>No steps yet</p>
                    {isOwner && (
                      <button
                        onClick={() => setAddStepOpen(true)}
                        className="text-xs font-semibold"
                        style={{ color: '#60a5fa' }}
                      >
                        + Add first step
                      </button>
                    )}
                  </div>
                ) : (
                  steps.map((step, i) => (
                    <StepListItem
                      key={step.id}
                      step={step}
                      active={i === activeStep}
                      isOwner={!!isOwner}
                      onClick={() => setActiveStep(i)}
                      onEdit={() => setEditStep(step)}
                      onDelete={() => handleDeleteStep(step)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Right: Step viewer or video-only placeholder */}
            <div className="lg:col-span-2">
              {steps.length === 0 && hasVideo ? (
                /* Video attached but no steps yet */
                <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Video size={28} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.25)' }} />
                  <p className="text-sm font-semibold text-white mb-1">Video guide</p>
                  <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.38)' }}>Add steps to pair with your video for a hybrid walkthrough experience.</p>
                  {isOwner && (
                    <button
                      onClick={() => setAddStepOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                    >
                      <Plus size={12} /> Add Steps
                    </button>
                  )}
                </div>
              ) : currentStep ? (
                <StepViewer
                  step={currentStep}
                  totalSteps={steps.length}
                  activeIdx={activeStep}
                  onPrev={() => setActiveStep((i) => Math.max(0, i - 1))}
                  onNext={() => setActiveStep((i) => Math.min(steps.length - 1, i + 1))}
                  onDone={() => navigate('/dashboard')}
                  onSeekVideo={guide.video_type === 'uploaded' || guide.video_type === 'recorded' ? handleSeekVideo : undefined}
                />
              ) : null}
            </div>
          </div>
        ) : (
          /* Truly empty — no video, no steps */
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <EmptyState
              onOpenRecordModal={() => setRecordModalOpen(true)}
              onAddManual={() => setAddStepOpen(true)}
            />
          </div>
        )}
      </div>

      {/* ── Modals ── */}

      {isOwner && (
        <RecordModal
          open={recordModalOpen}
          onClose={() => setRecordModalOpen(false)}
          onStartRecording={handleStartRecording}
          onUploadVideo={handleUploadVideo}
          onAddYouTube={handleAddYouTube}
        />
      )}

      <AddStepModal
        open={addStepOpen}
        onClose={() => {
          setAddStepOpen(false);
          if (recordingState === 'recording' && steps.length === 0) handleCancelRecording();
        }}
        onSave={handleAddStep}
        isRecording={recordingState === 'recording'}
        token={token}
        hasVideo={hasVideo}
      />

      <AddStepModal
        open={editStep !== null}
        initial={editStep ? {
          id: editStep.id,
          title: editStep.title,
          description: editStep.description,
          screenshot_url: editStep.screenshot_url || '',
          video_timestamp_seconds: editStep.video_timestamp_seconds != null ? String(editStep.video_timestamp_seconds) : '',
        } : undefined}
        onClose={() => setEditStep(null)}
        onSave={handleEditStep}
        isRecording={false}
        token={token}
        hasVideo={hasVideo}
      />

      {guide && token && (
        <ShareModal
          open={shareOpen}
          guide={guide}
          share={share}
          token={token}
          onClose={() => setShareOpen(false)}
          onUpdate={handleShareUpdate}
          onToast={showToast}
        />
      )}

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && <Toast key={toast + Date.now()} message={toast} onDismiss={() => setToast('')} />}
      </AnimatePresence>
    </AppShell>
  );
};
