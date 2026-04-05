import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Star,
  Clock,
  Users,
  FileText,
  Settings,
  Search,
  Plus,
  ChevronLeft,
  Menu,
  LogOut,
  Bell,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'My Guides',   to: '/dashboard' },
  { icon: Star,            label: 'Favorites',    to: '/dashboard/favorites' },
  { icon: Clock,           label: 'Recent',       to: '/dashboard/recent' },
  { icon: Users,           label: 'Team Guides',  to: '/dashboard/team' },
  { icon: FileText,        label: 'Templates',    to: '/templates' },
];

const BOTTOM_ITEMS = [
  { icon: Settings, label: 'Settings', to: '/dashboard/settings' },
];

interface AppShellProps {
  children: ReactNode;
  onNewGuide?: () => void;
  primaryCtaLabel?: string;
  primaryCtaHighlighted?: boolean;
  workspaceName?: string | null;
  /** Custom className for the main content wrapper. Pass '' to opt out of default padding. */
  contentClassName?: string;
}

export const AppShell = ({ children, onNewGuide, primaryCtaLabel = 'New Guide', primaryCtaHighlighted = false, workspaceName = null, contentClassName }: AppShellProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string) =>
    to === '/dashboard' ? location.pathname === '/dashboard' || location.pathname === '/app'
    : location.pathname.startsWith(to);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo + collapse */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <BrandLogo
              imageClassName="h-9 w-9 object-cover object-top rounded-lg ring-1 ring-white/20 shadow-[0_0_16px_rgba(96,165,250,0.28)]"
              wordmarkClassName="text-white font-semibold text-sm tracking-tight"
            />
            {workspaceName && (
              <span className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {workspaceName}
              </span>
            )}
          </div>
        )}
        {collapsed && (
          <BrandLogo className="mx-auto" imageClassName="h-8 w-8 object-cover object-top rounded-lg ring-1 ring-white/20" iconOnly />
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronLeft size={14} />
          </motion.span>
        </button>
      </div>

      {/* New Guide button */}
      <div className="px-3 py-4">
        <motion.button
          onClick={onNewGuide}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-sm text-white"
          style={{
            background: primaryCtaHighlighted
              ? 'linear-gradient(135deg, #f59e0b, #f97316)'
              : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            boxShadow: primaryCtaHighlighted
              ? '0 2px 14px rgba(249,115,22,0.45)'
              : '0 2px 12px rgba(139,92,246,0.35)',
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          {!collapsed && <span>{primaryCtaLabel}</span>}
        </motion.button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, to }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                background: active ? 'rgba(96,165,250,0.12)' : 'transparent',
                color: active ? '#93c5fd' : 'rgba(255,255,255,0.55)',
                border: active ? '1px solid rgba(96,165,250,0.2)' : '1px solid transparent',
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '12px' }}>
        {BOTTOM_ITEMS.map(({ icon: Icon, label, to }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <Icon size={16} strokeWidth={2} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        {/* User row */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl mt-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white' }}
          >
            {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name ?? 'User'}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="flex-shrink-0 p-1 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              aria-label="Sign out"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#050c18' }}>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 224 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-col flex-shrink-0 overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="fixed left-0 top-0 bottom-0 w-56 z-50 lg:hidden flex flex-col"
              style={{ background: '#0b1426', borderRight: '1px solid rgba(255,255,255,0.09)' }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(5,12,24,0.8)', backdropFilter: 'blur(16px)' }}
        >
          {/* Mobile hamburger */}
          <button
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: 'rgba(255,255,255,0.07)' }}
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={16} className="text-white" />
          </button>

          {/* Search */}
          <div
            className="flex items-center gap-2.5 flex-1 max-w-sm px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Search size={14} style={{ color: 'rgba(255,255,255,0.35)' }} />
            <input
              type="text"
              placeholder="Search guides…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'rgba(255,255,255,0.7)', caretColor: '#60a5fa' }}
            />
            <kbd
              className="hidden sm:flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}
            >
              ⌘K
            </kbd>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            <button
              className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.05)' }}
              aria-label="Notifications"
            >
              <Bell size={15} />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: '#60a5fa' }}
              />
            </button>

            {/* New guide (top bar shortcut) */}
            <motion.button
              onClick={onNewGuide}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold"
              style={{
                background: primaryCtaHighlighted
                  ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                  : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              }}
            >
              <Plus size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">{primaryCtaLabel}</span>
            </motion.button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className={contentClassName ?? 'px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto'}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
