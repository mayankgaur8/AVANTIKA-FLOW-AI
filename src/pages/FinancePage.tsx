import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign, FileText, CheckCircle2, Shield, BookOpen,
  ArrowRight, Play, TrendingUp, Clock, Users, Sparkles,
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { useProductCTA } from '../hooks/useProductCTA';

const USE_CASES = [
  {
    icon: FileText,
    title: 'Invoice Processing Workflows',
    description: 'Standardize AP processes so every invoice follows the same approved path—no exceptions, no missed steps.',
    color: '#10b981',
    to: '/finance/invoice-processing',
    cta: 'Build Invoice Workflow',
  },
  {
    icon: CheckCircle2,
    title: 'Expense Approval SOPs',
    description: 'Enforce expense policy every time with guided approval flows that adapt to your org hierarchy.',
    color: '#3b82f6',
    to: '/finance/expense-approvals',
    cta: 'Build Expense SOP',
  },
  {
    icon: Shield,
    title: 'Audit Documentation',
    description: 'Always audit-ready. Capture every process automatically so your documentation never falls behind.',
    color: '#8b5cf6',
    to: '/finance/audit-docs',
    cta: 'Build Audit Docs',
  },
  {
    icon: BookOpen,
    title: 'Financial Tool Training',
    description: 'Fast-track adoption of ERP, accounting platforms, and reporting tools with step-by-step video guides.',
    color: '#f59e0b',
    to: '/finance/tool-training',
    cta: 'Build Training Guide',
  },
];

const STATS = [
  { value: '80%', label: 'Reduction in process errors' },
  { value: '3×', label: 'Faster close cycles' },
  { value: '100%', label: 'Audit trail coverage' },
  { value: '2 days', label: 'Average tool onboarding time' },
];

export const FinancePage = () => {
  const { handleCTA } = useProductCTA();
  return (
    <div className="min-h-screen" style={{ background: '#050c18' }}>
      <Navigation />

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
            >
              <DollarSign size={12} /> FOR FINANCE & ACCOUNTING
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
              Workflows that close the books
              <span style={{ color: '#10b981' }}> faster.</span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              Standardize every finance process—from invoice approval to quarterly close—so your team executes flawlessly every cycle.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.button
                onClick={() => handleCTA('finance-workflow', { sourcePage: '/solutions/finance', ctaClicked: 'finance_hero_start' })}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold"
                style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', boxShadow: '0 4px 20px rgba(16,185,129,0.35)' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Start Recording Workflows <ArrowRight size={16} />
              </motion.button>
              <motion.button
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-white/80 font-medium"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                whileHover={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <Play size={14} /> See a Demo
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-xs text-white/50 leading-snug">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3">Everything finance runs on processes</h2>
            <p className="text-white/50">Capture them once. Run them perfectly, every time.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {USE_CASES.map((uc, i) => {
              const Icon = uc.icon;
              return (
                <motion.div
                  key={uc.title}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={uc.to}
                    className="block rounded-2xl p-7 group no-underline transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'inherit', textDecoration: 'none' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${uc.color}40`;
                      (e.currentTarget as HTMLElement).style.background = `${uc.color}08`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                      style={{ background: `${uc.color}18` }}
                    >
                      <Icon size={20} strokeWidth={1.8} style={{ color: uc.color }} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{uc.title}</h3>
                    <p className="text-white/55 text-sm leading-relaxed mb-4">{uc.description}</p>
                    <div className="flex items-center gap-1.5 text-xs font-semibold transition-colors duration-150"
                      style={{ color: uc.color }}
                    >
                      {uc.cta} <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* AI Templates */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div
            className="rounded-3xl p-10"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={16} style={{ color: '#10b981' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#10b981' }}>AI-Powered Templates</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Get started in seconds</h2>
            <p className="text-white/50 mb-8">Choose a template and Avantika Flow AI creates your first guide automatically.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Document invoice approval process', 'Create expense reporting SOP', 'Build quarterly close checklist'].map((tpl) => (
                <motion.button
                  key={tpl}
                  onClick={() => handleCTA('finance-workflow', { sourcePage: '/solutions/finance', ctaClicked: 'finance_template' })}
                  className="flex items-start gap-2.5 p-4 rounded-xl text-left text-sm text-white/70 hover:text-white transition-all duration-150"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  whileHover={{ background: 'rgba(255,255,255,0.10)', scale: 1.01 }}
                >
                  <Sparkles size={13} className="flex-shrink-0 mt-0.5 text-emerald-400" />
                  {tpl}
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-14"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(139,92,246,0.12))', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex justify-center gap-4 mb-5 text-white/30">
              <TrendingUp size={20} />
              <Clock size={20} />
              <Users size={20} />
            </div>
            <h2 className="text-4xl font-black text-white mb-4">Your finance team deserves better processes</h2>
            <p className="text-white/50 mb-8 text-lg">Start documenting workflows today — no setup, no IT ticket required.</p>
            <motion.button
              onClick={() => handleCTA('finance-workflow', { sourcePage: '/solutions/finance', ctaClicked: 'finance_bottom_cta' })}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-base"
              style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', boxShadow: '0 6px 28px rgba(16,185,129,0.35)' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started Free <ArrowRight size={18} />
            </motion.button>
            <p className="text-white/30 text-xs mt-4">No credit card required · Setup in 2 minutes</p>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
