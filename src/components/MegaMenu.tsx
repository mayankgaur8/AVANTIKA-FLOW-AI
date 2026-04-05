import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Settings, Monitor, DollarSign, Users, GraduationCap,
  FileText, UserCheck, Terminal, UserPlus, MessageSquare,
  ArrowRight, Camera, Zap, Brain, Plug, BookOpen,
  Star, Layout, Shield, ExternalLink, ChevronRight,
  Sparkles, Lightbulb, PlayCircle, CheckCircle2, GitBranch,
  Layers, Wrench,
  type LucideIcon,
} from 'lucide-react';
import React from 'react';
import { api, type CustomerSpotlight, type ResourceArticle } from '../lib/api';

type MenuType = 'solutions' | 'product' | 'customers' | 'resources';

interface MegaMenuProps {
  menuType: MenuType;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClose: () => void;
  onTalkToSales?: () => void;
  onGetStarted?: () => void;
}

interface MenuItem {
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  to?: string;
}

const menuItemVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.22, ease: 'easeOut' },
  }),
};

const MenuItemRow: React.FC<{ item: MenuItem; index: number; onClose?: () => void }> = ({ item, index, onClose }) => {
  const Icon = item.icon;

  const inner = (
    <>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0 transition-all duration-200 group-hover:scale-110"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))' }}
      >
        <Icon size={15} className="text-blue-600" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors duration-150 leading-tight">
          {item.label}
        </div>
        {item.sublabel && (
          <div className="text-xs text-gray-500 mt-0.5 leading-snug">{item.sublabel}</div>
        )}
      </div>
    </>
  );

  const sharedMotionProps = {
    custom: index,
    variants: menuItemVariants,
    initial: 'hidden' as const,
    animate: 'visible' as const,
    className: 'flex items-start gap-3 px-3 py-2.5 rounded-xl group cursor-pointer no-underline',
    style: { color: 'inherit', textDecoration: 'none' },
    whileHover: { backgroundColor: 'rgba(59,130,246,0.07)' },
    transition: { duration: 0.15 },
  };

  if (item.to) {
    return (
      <motion.div {...sharedMotionProps}>
        <Link
          to={item.to}
          onClick={onClose}
          className="flex items-start gap-3 w-full"
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          {inner}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.a
      href="#"
      {...sharedMotionProps}
      onClick={(e) => e.preventDefault()}
    >
      {inner}
    </motion.a>
  );
};

// ─── SOLUTIONS MEGA MENU ──────────────────────────────────────────────────────

type FunctionKey = 'operations' | 'it' | 'finance' | 'customer' | 'hr';

interface UseCase {
  icon: LucideIcon;
  label: string;
  benefit: string;
  to: string;
}

interface FunctionData {
  label: string;
  icon: LucideIcon;
  description: string;
  color: string;
  to: string;
  useCases: UseCase[];
  templates: string[];
}

const SOLUTIONS: Record<FunctionKey, FunctionData> = {
  operations: {
    label: 'Operations',
    icon: Settings,
    description: 'Standardize and scale business processes',
    color: '#3b82f6',
    to: '/solutions/operations',
    useCases: [
      { icon: FileText,   label: 'SOP Creation & Automation',  benefit: 'Turn any process into a reusable guide instantly',          to: '/workflow-ai/sop-builder' },
      { icon: Layers,     label: 'Process Documentation',       benefit: 'Capture steps before institutional knowledge walks out',    to: '/workflow-ai/process-capture' },
      { icon: GitBranch,  label: 'Workflow Standardization',    benefit: 'Eliminate inconsistency across teams and locations',        to: '/workflow-ai/standardize' },
      { icon: BookOpen,   label: 'Internal Training Guides',    benefit: 'Get new hires productive in days, not weeks',               to: '/workflow-ai/training-builder' },
    ],
    templates: ['Create SOP for onboarding process', 'Document internal workflow', 'Build operations runbook'],
  },
  it: {
    label: 'IT',
    icon: Monitor,
    description: 'Document systems, onboarding, and troubleshooting',
    color: '#8b5cf6',
    to: '/solutions/it',
    useCases: [
      { icon: UserPlus,      label: 'System Onboarding Guides',      benefit: 'New employee IT setup in one click-through guide',        to: '/it/onboarding-guides' },
      { icon: Wrench,        label: 'Troubleshooting Documentation',  benefit: 'Stop re-solving the same problems — capture the fix',    to: '/it/troubleshooting' },
      { icon: Terminal,      label: 'DevOps Runbooks',                benefit: 'Ship faster with documented deployment checklists',       to: '/it/devops-runbooks' },
      { icon: Monitor,       label: 'Software Setup Tutorials',       benefit: 'Standardize tool adoption across the entire org',         to: '/it/software-tutorials' },
    ],
    templates: ['Create system setup guide', 'Record troubleshooting steps', 'Document DevOps runbook'],
  },
  finance: {
    label: 'Finance & Accounting',
    icon: DollarSign,
    description: 'Streamline compliance, approvals, and reporting',
    color: '#10b981',
    to: '/solutions/finance',
    useCases: [
      { icon: FileText,     label: 'Invoice Processing Workflows', benefit: 'Consistent AP processes that scale with your volume',      to: '/finance/invoice-processing' },
      { icon: CheckCircle2, label: 'Expense Approval SOPs',        benefit: 'Enforce policy every time with guided approval flows',     to: '/finance/expense-approvals' },
      { icon: Shield,       label: 'Audit Documentation',          benefit: 'Always audit-ready with automated trail capture',         to: '/finance/audit-docs' },
      { icon: BookOpen,     label: 'Financial Tool Training',      benefit: 'Fast-track adoption of ERP and accounting platforms',     to: '/finance/tool-training' },
    ],
    templates: ['Document invoice approval process', 'Create expense reporting SOP', 'Build audit checklist guide'],
  },
  customer: {
    label: 'Customer-facing Teams',
    icon: Users,
    description: 'Delight customers with consistent, guided experiences',
    color: '#f59e0b',
    to: '/solutions/customer',
    useCases: [
      { icon: UserCheck,     label: 'Customer Onboarding Flows',    benefit: 'Turn first-time users into power users, systematically', to: '/customer/onboarding-flows' },
      { icon: MessageSquare, label: 'Support Response Playbooks',   benefit: 'Resolve tickets faster with guided, consistent answers', to: '/customer/support-playbooks' },
      { icon: PlayCircle,    label: 'Demo Walkthrough Guides',      benefit: 'Empower every rep to run a flawless product demo',       to: '/customer/demo-guides' },
      { icon: Zap,           label: 'Sales Enablement Workflows',   benefit: 'Get new reps to quota faster with proven playbooks',     to: '/customer/sales-workflows' },
    ],
    templates: ['Build customer onboarding guide', 'Create support playbook', 'Document demo flow'],
  },
  hr: {
    label: 'HR & L&D',
    icon: GraduationCap,
    description: 'Build a learning culture with scalable training programs',
    color: '#ec4899',
    to: '/solutions/hr',
    useCases: [
      { icon: UserPlus,     label: 'Employee Onboarding Guides', benefit: 'Every new hire gets the same great first-week experience',  to: '/hr/onboarding-guides' },
      { icon: GraduationCap, label: 'Training Programs',         benefit: 'Build modular L&D content your team actually finishes',    to: '/hr/training-programs' },
      { icon: BookOpen,     label: 'Internal Knowledge Base',    benefit: 'Capture institutional knowledge before it leaves',         to: '/hr/knowledge-base' },
      { icon: Shield,       label: 'Policy & Compliance SOPs',   benefit: 'Keep everyone aligned on the latest policies automatically', to: '/hr/compliance-sops' },
    ],
    templates: ['Create employee onboarding guide', 'Build compliance training SOP', 'Document team handbook'],
  },
};

const FUNCTION_ORDER: FunctionKey[] = ['operations', 'it', 'finance', 'customer', 'hr'];

const SolutionsMenu: React.FC<{
  onClose: () => void;
  onGetStarted?: () => void;
}> = ({ onClose, onGetStarted }) => {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState<FunctionKey>('operations');
  const active = SOLUTIONS[activeKey];

  return (
    <div className="flex" style={{ width: '860px' }}>

      {/* ── Column 1: By Function ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 p-5" style={{ width: '230px' }}>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-2">
          By Function
        </p>
        <div className="space-y-0.5">
          {FUNCTION_ORDER.map((key, i) => {
            const fn = SOLUTIONS[key];
            const Icon = fn.icon;
            const isActive = key === activeKey;
            return (
              <motion.button
                key={key}
                custom={i}
                variants={menuItemVariants}
                initial="hidden"
                animate="visible"
                onClick={() => { setActiveKey(key); onClose(); }}
                onMouseEnter={() => setActiveKey(key)}
                className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group"
                style={{
                  background: isActive ? `${fn.color}12` : 'transparent',
                  border: isActive ? `1px solid ${fn.color}25` : '1px solid transparent',
                }}
                whileHover={{ background: isActive ? `${fn.color}15` : 'rgba(59,130,246,0.06)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0 transition-all duration-200"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${fn.color}25, ${fn.color}15)`
                      : 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))',
                  }}
                >
                  <Icon
                    size={15}
                    strokeWidth={1.8}
                    style={{ color: isActive ? fn.color : '#6b7280' }}
                    className="transition-colors duration-150"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-semibold leading-tight transition-colors duration-150"
                    style={{ color: isActive ? fn.color : '#374151' }}
                  >
                    {fn.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-snug line-clamp-1">
                    {fn.description}
                  </div>
                </div>
                {isActive && (
                  <ChevronRight size={12} className="mt-1 flex-shrink-0 opacity-50" style={{ color: fn.color }} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px bg-gray-100 my-4" />

      {/* ── Column 2: Dynamic Use Cases ───────────────────────────────────── */}
      <div className="flex-1 p-5 overflow-hidden" style={{ minWidth: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeKey}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <div
                className="w-1.5 h-4 rounded-full"
                style={{ background: active.color }}
              />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Use Cases
              </p>
            </div>
            <div className="space-y-1">
              {active.useCases.map((uc, i) => {
                const UcIcon = uc.icon;
                return (
                  <Link
                    key={uc.label}
                    to={uc.to}
                    onClick={onClose}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-xl group transition-all duration-150"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = `${active.color}09`)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${active.color}12` }}
                    >
                      <UcIcon size={14} strokeWidth={1.8} style={{ color: active.color }} />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 + 0.02 }}
                      className="flex-1 min-w-0"
                    >
                      <div className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 leading-tight transition-colors duration-150">
                        {uc.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 leading-snug">
                        {uc.benefit}
                      </div>
                    </motion.div>
                    <ChevronRight
                      size={12}
                      className="mt-1 flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity duration-150 text-gray-400"
                    />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="w-px bg-gray-100 my-4" />

      {/* ── Column 3: CTA + AI Templates ──────────────────────────────────── */}
      <div className="flex-shrink-0 p-5 flex flex-col gap-4" style={{ width: '220px' }}>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-xl p-3 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.07), rgba(139,92,246,0.07))' }}
        >
          <div className="text-lg font-black text-gray-800">50,000+</div>
          <div className="text-xs text-gray-500 leading-snug">workflows created this week</div>
        </motion.div>

        {/* Primary CTA */}
        <motion.button
          onClick={() => {
            onClose();
            navigate('/workflow-ai/record');
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
          style={{ background: `linear-gradient(135deg, ${active.color}, #8b5cf6)` }}
          whileHover={{ scale: 1.02, boxShadow: `0 4px 20px ${active.color}50` }}
          whileTap={{ scale: 0.98 }}
        >
          Start Recording <ArrowRight size={13} />
        </motion.button>

        {/* Secondary CTA */}
        <Link
          to="/workflow-ai/examples"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-800 transition-all duration-150"
          style={{ textDecoration: 'none' }}
        >
          View examples <ExternalLink size={12} />
        </Link>

        {/* AI Templates */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb size={11} className="text-amber-500" />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                AI Templates
              </p>
            </div>
            <div className="space-y-1.5">
              {active.templates.map((tpl, i) => (
                <motion.button
                  key={tpl}
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => {
                    onClose();
                    navigate('/workflow-ai/templates', { state: { prompt: tpl } });
                  }}
                  className="w-full text-left text-xs px-2.5 py-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-150 leading-snug flex items-start gap-1.5"
                >
                  <Sparkles size={9} className="flex-shrink-0 mt-0.5 text-purple-400" />
                  {tpl}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── PRODUCT MENU ─────────────────────────────────────────────────────────────

const products: MenuItem[] = [
  { label: 'Capture', sublabel: 'Documentation that writes itself', icon: Camera, to: '/product/capture' },
  { label: 'Optimize', sublabel: 'Discover & improve workflows with AI', icon: Zap, to: '/product/optimize' },
];
const platform: MenuItem[] = [
  { label: 'Workflow AI', sublabel: 'Uplevel how your company works', icon: Brain, to: '/platform/workflow-ai' },
  { label: 'Integrations & API', sublabel: "Put answers at everyone's fingertips", icon: Plug, to: '/platform/integrations' },
];

const ProductMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="flex gap-0" style={{ width: '680px' }}>
    {/* Col 1 — Products */}
    <div className="flex-1 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-3">Products</p>
      {products.map((item, i) => <MenuItemRow key={item.label} item={item} index={i} onClose={onClose} />)}
    </div>

    <div className="w-px bg-gray-100 my-4" />

    {/* Col 2 — Platform */}
    <div className="flex-1 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-3">Platform</p>
      {platform.map((item, i) => <MenuItemRow key={item.label} item={item} index={i + 2} onClose={onClose} />)}
    </div>

    <div className="w-px bg-gray-100 my-4" />

    {/* Col 3 — What's New */}
    <div className="w-56 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-3">What's new</p>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="block rounded-2xl overflow-hidden border border-gray-100 cursor-pointer group"
        whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
      >
        <Link to="/platform/agents" onClick={onClose} className="block no-underline" style={{ color: 'inherit' }}>
        {/* Feature card illustration */}
        <div
          className="h-24 flex items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)' }}
        >
          <Sparkles size={28} className="text-purple-500" />
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">NEW</span>
          </div>
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-gray-800">Optimize Agents</p>
          <p className="text-xs text-gray-500 mt-1 leading-snug">AI agents that find and fix workflow inefficiencies</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 font-medium group-hover:gap-2 transition-all duration-150">
            Learn more <ChevronRight size={12} />
          </div>
        </div>
        </Link>
      </motion.div>
    </div>
  </div>
);

// ─── CUSTOMERS MENU ───────────────────────────────────────────────────────────

const CustomersMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [featuredSpotlight, setFeaturedSpotlight] = useState<CustomerSpotlight | null>(null);

  useEffect(() => {
    api.discoverSpotlight()
      .then((res) => setFeaturedSpotlight(res.featured))
      .catch(() => setFeaturedSpotlight(null));
  }, []);

  return (
  <div className="flex gap-0" style={{ width: '520px' }}>
    {/* Col 1 — Discover */}
    <div className="w-48 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-3">Discover</p>
      {[
        { label: 'Case studies', icon: BookOpen, to: '/discover/case-studies' },
        { label: 'Reviews', icon: Star, to: '/discover/reviews' },
      ].map((item, i) => <MenuItemRow key={item.label} item={item as MenuItem} index={i} onClose={onClose} />)}
    </div>

    <div className="w-px bg-gray-100 my-4" />

    {/* Col 2 — Spotlight */}
    <div className="flex-1 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-3">Customer Spotlight</p>
      <Link to="/customers/spotlight" onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl border border-gray-100 overflow-hidden"
      >
        {/* Brand logo area */}
        <div
          className="h-16 flex items-center justify-center px-4"
          style={{ background: 'linear-gradient(135deg, #f0f9ff, #f5f3ff)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-base font-bold text-gray-800">{featuredSpotlight?.company_name || 'Acme Corp'}</span>
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-600 leading-relaxed italic">
            "{featuredSpotlight?.highlight || 'Avantika Flow AI cut our onboarding time from 3 weeks to 3 days.'}"
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
            <div>
              <p className="text-xs font-semibold text-gray-800">{featuredSpotlight?.company_name || 'Featured Customer'}</p>
              <p className="text-[10px] text-gray-400">Impact Story</p>
            </div>
          </div>
          <motion.div
            className="flex items-center gap-1.5 mt-3 text-xs text-blue-600 font-semibold hover:gap-2.5 transition-all duration-150 cursor-pointer"
            whileHover={{ x: 2 }}
          >
            Read case study <ExternalLink size={11} />
          </motion.div>
        </div>
      </motion.div>
      </Link>
    </div>
  </div>
  );
};

// ─── RESOURCES MENU ───────────────────────────────────────────────────────────

const ResourcesMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [latestArticle, setLatestArticle] = useState<ResourceArticle | null>(null);

  useEffect(() => {
    api.resourcesGuides()
      .then((res) => setLatestArticle(res.articles[0] || null))
      .catch(() => setLatestArticle(null));
  }, []);

  return (
  <div className="flex gap-0" style={{ width: '440px' }}>
    {/* Col 1 — Explore */}
    <div className="w-44 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-3">Explore</p>
      {[
        { label: 'Template gallery', icon: Layout, to: '/resources/templates' },
        { label: 'Security', icon: Shield, to: '/resources/security' },
      ].map((item, i) => <MenuItemRow key={item.label} item={item as MenuItem} index={i} onClose={onClose} />)}
    </div>

    <div className="w-px bg-gray-100 my-4" />

    {/* Col 2 — Article */}
    <div className="flex-1 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-3">Latest</p>
      <Link to="/resources/guides" onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="block rounded-2xl border border-gray-100 overflow-hidden cursor-pointer group"
        whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      >
        {/* Image thumbnail */}
        <div
          className="h-24 flex items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #eff6ff 100%)' }}
        >
          <BookOpen size={26} className="text-emerald-500" />
          <div className="absolute bottom-2 left-3">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">GUIDE</span>
          </div>
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-gray-800 leading-snug">
            {latestArticle?.title || 'Latest workflow insight'}
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 font-medium group-hover:gap-2 transition-all duration-150">
            Read article <ChevronRight size={12} />
          </div>
        </div>
      </motion.div>
      </Link>
    </div>
  </div>
  );
};

// ─── MAIN MEGA MENU WRAPPER ───────────────────────────────────────────────────

export const MegaMenu: React.FC<MegaMenuProps> = ({ menuType, onMouseEnter, onMouseLeave, onClose, onTalkToSales, onGetStarted }) => {
  const renderContent = () => {
    switch (menuType) {
      case 'solutions': return <SolutionsMenu onClose={onClose} onGetStarted={onGetStarted} />;
      case 'product': return <ProductMenu onClose={onClose} />;
      case 'customers': return <CustomersMenu onClose={onClose} />;
      case 'resources': return <ResourcesMenu onClose={onClose} />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="mt-3 bg-white rounded-2xl overflow-hidden"
      style={{
        boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 6px 20px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.07)',
        zIndex: 60,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {renderContent()}
    </motion.div>
  );
};
