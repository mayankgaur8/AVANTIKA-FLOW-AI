import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
  onTalkToSales: () => void;
}

interface NavItem { label: string; to?: string }
interface NavSection { label: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Solutions',
    items: [
      { label: 'Operations',            to: '/solutions/operations' },
      { label: 'IT',                    to: '/solutions/it' },
      { label: 'Finance & Accounting',  to: '/solutions/finance' },
      { label: 'Customer-facing Teams', to: '/solutions/customer' },
      { label: 'HR & L&D',             to: '/solutions/hr' },
    ],
  },
  {
    label: 'Product',
    items: [
      { label: 'Capture',           to: '/product/capture' },
      { label: 'Optimize',          to: '/product/optimize' },
      { label: 'Workflow AI',       to: '/platform/workflow-ai' },
      { label: 'Integrations & API', to: '/platform/integrations' },
      { label: 'Optimize Agents',    to: '/platform/agents' },
    ],
  },
  {
    label: 'Customers',
    items: [
      { label: 'Case studies', to: '/discover/case-studies' },
      { label: 'Reviews', to: '/discover/reviews' },
      { label: 'Customer Spotlight', to: '/customers/spotlight' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'Template gallery', to: '/resources/templates' },
      { label: 'Security', to: '/resources/security' },
      { label: 'Latest guides', to: '/resources/guides' },
    ],
  },
];

const SIMPLE_NAV = ['Enterprise', 'Pricing'];

const AccordionSection: React.FC<{ section: NavSection; index: number; onClose: () => void }> = ({ section, index, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 + 0.15, duration: 0.3 }}
      className="border-b border-white/8"
    >
      <button
        className="flex items-center justify-between w-full px-6 py-4 text-left"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="text-white font-medium text-base">{section.label}</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} className="text-white/50" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-2">
              {section.items.map((item) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={onClose}
                    className="block px-8 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all duration-150"
                    style={{ textDecoration: 'none' }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="block px-8 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all duration-150"
                  >
                    {item.label}
                  </a>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onGetStarted, onTalkToSales }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 55 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm flex flex-col"
            style={{
              zIndex: 60,
              background: 'linear-gradient(160deg, #0a1628 0%, #0d0825 100%)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <BrandLogo
                imageClassName="h-10 w-10 object-cover object-top rounded-xl ring-1 ring-white/20 shadow-[0_0_18px_rgba(96,165,250,0.28)]"
                wordmarkClassName="text-white font-bold text-lg tracking-tight"
              />
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/8 hover:bg-white/12 transition-colors duration-150"
                aria-label="Close menu"
              >
                <X size={18} className="text-white/70" />
              </button>
            </div>

            {/* Nav sections */}
            <div className="flex-1 overflow-y-auto py-2">
              {NAV_SECTIONS.map((section, i) => (
                <AccordionSection key={section.label} section={section} index={i} onClose={onClose} />
              ))}

              {/* Simple links */}
              {SIMPLE_NAV.map((label, i) => (
                <motion.a
                  key={label}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (NAV_SECTIONS.length + i) * 0.05 + 0.15 }}
                  className="flex items-center px-6 py-4 text-white font-medium text-base border-b border-white/8 hover:bg-white/5 transition-colors duration-150"
                >
                  {label}
                </motion.a>
              ))}

              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (NAV_SECTIONS.length + SIMPLE_NAV.length) * 0.05 + 0.15 }}
                onClick={onTalkToSales}
                className="flex items-center w-full px-6 py-4 text-white font-medium text-base border-b border-white/8 hover:bg-white/5 transition-colors duration-150"
              >
                Talk to Sales
              </motion.button>
            </div>

            {/* Auth buttons at bottom */}
            <div className="px-6 py-6 border-t border-white/8 flex flex-col gap-3">
              <Link
                to="/signin"
                onClick={onClose}
                className="block text-center py-3 rounded-xl text-white/80 font-medium hover:text-white hover:bg-white/8 transition-all duration-150"
              >
                Sign in
              </Link>
              <button
                onClick={onGetStarted}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
              >
                Get Started Free <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
