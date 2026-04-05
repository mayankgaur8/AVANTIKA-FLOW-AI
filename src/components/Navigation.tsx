import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, ArrowRight, ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MegaMenu } from './MegaMenu';
import { MobileMenu } from './MobileMenu';
import { BrandLogo } from './BrandLogo';
import { useSalesInquiry } from '../context/SalesInquiryContext';
import { useAuth } from '../context/AuthContext';
import { startGoogleOAuth } from '../lib/oauth';
import { setPostAuthRedirect } from '../lib/postAuthRedirect';

type MenuType = 'solutions' | 'product' | 'customers' | 'resources';

const NAV_ITEMS: { label: string; menu?: MenuType; to?: string }[] = [
  { label: 'Solutions', menu: 'solutions' },
  { label: 'Product', menu: 'product' },
  { label: 'Customers', menu: 'customers' },
  { label: 'Resources', menu: 'resources' },
  { label: 'Enterprise', to: '/contact' },
  { label: 'Pricing', to: '/pricing' },
];

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openSales } = useSalesInquiry();
  const { state: authState } = useAuth();
  const [activeMenu, setActiveMenu] = useState<MenuType | null>(null);

  const isAuthenticated =
    authState === 'email_verified_with_team' || authState === 'onboarding_incomplete';

  /** Auth-aware "Get Started" — logged-in users go to dashboard, others start OAuth. */
  const handleGetStarted = (ctaClicked: string, dest = '/dashboard') => {
    if (isAuthenticated) {
      navigate(dest);
      return;
    }
    setPostAuthRedirect(dest);
    startGoogleOAuth({ sourcePage: location.pathname, ctaClicked, redirectTo: dest });
  };
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openMenu = useCallback((menu: MenuType) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveMenu(menu);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setActiveMenu(null), 140);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* Page dimmer overlay when menu is open */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 bottom-0 bg-black/40 backdrop-blur-[2px]"
            style={{ zIndex: 40, top: '64px' }}
            onClick={() => setActiveMenu(null)}
          />
        )}
      </AnimatePresence>

      <nav
        className="sticky top-0 w-full transition-all duration-300"
        style={{
          zIndex: 50,
          background: isScrolled || activeMenu
            ? 'rgba(5,12,24,0.94)'
            : 'rgba(5,12,24,0.50)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderBottom: isScrolled || activeMenu
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(255,255,255,0.06)',
          boxShadow: isScrolled ? '0 4px 30px rgba(0,0,0,0.35)' : 'none',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="relative max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <motion.div
              className="flex items-center gap-2.5 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-xl"
              aria-label="Avantika Flow AI home"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <BrandLogo
                imageClassName="h-10 w-10 object-cover object-top rounded-xl ring-1 ring-white/20 shadow-[0_0_18px_rgba(96,165,250,0.32)]"
                wordmarkClassName="text-white font-bold text-lg tracking-tight hidden sm:block"
              />
            </motion.div>

            {/* Desktop Nav */}
            <ul className="hidden lg:flex items-center gap-0.5" role="menubar">
              {NAV_ITEMS.map(({ label, menu, to }) => (
                <li key={label} role="none">
                  {menu ? (
                    <button
                      role="menuitem"
                      aria-haspopup="true"
                      aria-expanded={activeMenu === menu}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent"
                      style={{
                        color: activeMenu === menu ? 'white' : 'rgba(255,255,255,0.70)',
                        background: activeMenu === menu ? 'rgba(255,255,255,0.10)' : 'transparent',
                      }}
                      onMouseEnter={() => openMenu(menu)}
                      onClick={() => setActiveMenu((prev) => (prev === menu ? null : menu))}
                      onMouseLeave={scheduleClose}
                      onFocus={() => openMenu(menu)}
                      onBlur={scheduleClose}
                    >
                      {label}
                      <motion.span
                        className="inline-flex text-white/50"
                        animate={{ rotate: activeMenu === menu ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      >
                        <ChevronDown size={13} strokeWidth={2.5} />
                      </motion.span>
                    </button>
                  ) : to ? (
                    <Link
                      to={to}
                      role="menuitem"
                      className="flex items-center px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      style={{ color: location.pathname === to ? 'white' : 'rgba(255,255,255,0.70)' }}
                      onMouseEnter={scheduleClose}
                      onFocus={scheduleClose}
                    >
                      {label}
                    </Link>
                  ) : (
                    <span
                      role="menuitem"
                      className="flex items-center px-3.5 py-2 rounded-xl text-sm font-medium"
                      style={{ color: 'rgba(255,255,255,0.70)' }}
                    >
                      {label}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {/* Right side: Sign in + Get Started */}
            <div className="hidden lg:flex items-center gap-1.5">
              <Link
                to="/signin"
                className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                style={{ color: 'rgba(255,255,255,0.70)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
              >
                Sign in
              </Link>
              <motion.button
                onClick={() => handleGetStarted('navbar_get_started')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold select-none"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  boxShadow: '0 2px 14px rgba(139,92,246,0.38)',
                }}
                whileHover={{ scale: 1.04, boxShadow: '0 4px 22px rgba(139,92,246,0.58)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Get Started <ArrowRight size={13} strokeWidth={2.5} />
              </motion.button>
            </div>

            {/* Mobile hamburger */}
            <motion.button
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open mobile menu"
              aria-expanded={isMobileOpen}
              whileHover={{ background: 'rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu size={17} className="text-white" />
            </motion.button>
          </div>

          {/* Mega Menu portal — positioned below the nav bar */}
          <AnimatePresence>
            {activeMenu && (
              <div
                className="absolute left-0 right-0 top-full flex justify-center"
                style={{ pointerEvents: 'auto', zIndex: 60 }}
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              >
                <MegaMenu
                  menuType={activeMenu}
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                  onClose={() => setActiveMenu(null)}
                  onGetStarted={() => {
                    setActiveMenu(null);
                    handleGetStarted('mega_menu_get_started');
                  }}
                  onTalkToSales={() => {
                    setActiveMenu(null);
                    openSales({ sourcePage: location.pathname, ctaClicked: 'mega_menu_talk_to_sales' });
                  }}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <MobileMenu
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        onGetStarted={() => {
          setIsMobileOpen(false);
          handleGetStarted('mobile_get_started');
        }}
        onTalkToSales={() => {
          setIsMobileOpen(false);
          openSales({ sourcePage: location.pathname, ctaClicked: 'mobile_talk_to_sales' });
        }}
      />
    </>
  );
};
