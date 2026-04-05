import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Monitor, ShieldCheck, Rocket, TrendingUp, ArrowRight, CheckCircle2,
  ChevronRight, Camera, Zap, Brain, Settings, Headphones,
  CheckCircle, BarChart3, Clock, Users, BookOpen, Play,
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { useProductCTA } from '../hooks/useProductCTA';

// ─── IT WORKFLOW ILLUSTRATION ─────────────────────────────────────────────────

const IT_STEPS = [
  { label: 'Set up dev environment', done: true },
  { label: 'Install & configure tools', done: true },
  { label: 'Grant user permissions', done: true },
  { label: 'Run security compliance check', done: false, active: true },
  { label: 'Deploy & notify stakeholders', done: false },
];

const ITWorkflowIllustration = () => (
  <div className="relative w-full max-w-md mx-auto lg:mx-0">
    <div
      className="absolute inset-0 rounded-3xl pointer-events-none"
      style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.14) 0%, rgba(59,130,246,0.09) 40%, transparent 70%)', filter: 'blur(60px)', transform: 'scale(1.25)' }}
    />

    {/* Main card */}
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
      style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.12), 0 8px 20px rgba(99,102,241,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}
        >
          <Monitor size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">Software Deployment Guide</p>
          <p className="text-xs text-gray-400">IT Team · v2.4</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex-shrink-0">
          In Progress
        </span>
      </div>

      {/* Compliance score */}
      <div className="px-5 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-indigo-700 font-semibold flex items-center gap-1.5">
            <ShieldCheck size={11} /> Security Compliance
          </span>
          <span className="text-xs font-black text-indigo-700">94%</span>
        </div>
        <div className="h-1.5 rounded-full bg-indigo-100 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '94%' }}
            transition={{ delay: 0.9, duration: 1.1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #6366f1, #3b82f6)' }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-gray-50">
        {IT_STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
            className={`flex items-center gap-3 px-5 py-3 ${step.active ? 'bg-indigo-50/60' : ''}`}
          >
            <div className="flex-shrink-0">
              {step.done ? (
                <CheckCircle size={16} className="text-emerald-500" fill="currentColor" />
              ) : step.active ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="w-4 h-4 rounded-full border-2 border-indigo-500 flex items-center justify-center"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                </motion.div>
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
              )}
            </div>
            <span className={`text-sm flex-1 ${step.done ? 'text-gray-500' : step.active ? 'text-indigo-700 font-semibold' : 'text-gray-400'}`}>
              {step.label}
            </span>
            <span className="text-[10px] font-semibold text-gray-300">0{i + 1}</span>
          </motion.div>
        ))}
      </div>

      <div className="px-5 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 flex items-center gap-2">
        <Zap size={13} className="text-indigo-500 flex-shrink-0" />
        <p className="text-xs text-indigo-700 font-medium">12 IT tickets automated this week</p>
      </div>
    </motion.div>

    {/* Floating: tickets resolved */}
    <motion.div
      initial={{ opacity: 0, x: -20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="absolute -left-6 top-8 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100"
    >
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-indigo-500" />
        <div>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Avg. setup time</p>
          <p className="text-lg font-black text-gray-900 leading-tight">45min <span className="text-xs font-medium text-gray-400">saved</span></p>
        </div>
      </div>
    </motion.div>

    {/* Floating: compliance */}
    <motion.div
      initial={{ opacity: 0, x: 20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: 1.0, duration: 0.6 }}
      className="absolute -right-6 bottom-8 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100"
    >
      <div className="flex items-center gap-2">
        <BarChart3 size={14} className="text-emerald-500" />
        <div>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Ticket reduction</p>
          <p className="text-lg font-black">
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #6366f1, #3b82f6)' }}>
              ↓ 68%
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  </div>
);

// ─── DATA ─────────────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: Monitor,
    title: 'Reduce IT ticket volume',
    description: 'Self-service documentation means your team finds answers before filing a ticket — cutting support load by up to 68%.',
    gradient: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
  },
  {
    icon: ShieldCheck,
    title: 'Ensure security compliance',
    description: 'Auto-generated compliance checklists and audit trails keep your organization consistently aligned with security standards.',
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: Rocket,
    title: 'Accelerate software rollouts',
    description: 'Document every deployment step once. Reuse it across your entire org — making rollouts repeatable and error-free.',
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  {
    icon: TrendingUp,
    title: 'Standardize tech onboarding',
    description: 'New engineers get productive 3× faster with auto-generated, role-specific technical onboarding guides.',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
];

const STEPS = [
  {
    icon: Camera,
    title: 'Capture IT workflows',
    description: 'Record any IT process — from software installs to network configuration — with a single click. No manual documentation.',
    bg: 'from-indigo-500 to-blue-600',
  },
  {
    icon: Brain,
    title: 'Generate step-by-step guides',
    description: 'AI converts your recordings into clean, structured guides with screenshots, commands, and decision trees built in.',
    bg: 'from-violet-500 to-purple-600',
  },
  {
    icon: Zap,
    title: 'Deploy across the organization',
    description: 'Publish guides instantly to your team, embed in your ticketing system, or share via your IT portal — automatically kept up to date.',
    bg: 'from-pink-500 to-rose-600',
  },
];

const USE_CASES = [
  {
    icon: Monitor,
    team: 'IT teams',
    headline: 'Resolve issues before they become tickets',
    description: 'Build a living knowledge base of your most common IT fixes, setup guides, and troubleshooting paths.',
    tags: ['Runbooks', 'Setup guides', 'Troubleshooting'],
    color: '#6366f1',
    bg: 'from-indigo-50 to-blue-50',
    border: 'border-indigo-100',
  },
  {
    icon: Settings,
    team: 'Operations teams',
    headline: 'Run ops with zero ambiguity',
    description: 'Standardize every operational workflow into repeatable processes your whole team executes consistently.',
    tags: ['SOPs', 'Process docs', 'Runbooks'],
    color: '#3b82f6',
    bg: 'from-blue-50 to-sky-50',
    border: 'border-blue-100',
  },
  {
    icon: Headphones,
    team: 'Support teams',
    headline: 'Empower agents with instant answers',
    description: 'Equip support reps with searchable playbooks so every issue gets resolved faster, with more consistency.',
    tags: ['Resolution guides', 'Escalation flows', 'FAQ'],
    color: '#10b981',
    bg: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-100',
  },
];

const LOGOS = ['Stripe', 'Notion', 'Salesforce', 'Atlassian', 'HubSpot', 'Figma'];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { delay: d, duration: 0.65, ease: [0.16, 1, 0.3, 1] } }),
};

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export const ITPage = () => {
  const location = useLocation();
  const { handleCTA } = useProductCTA();

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: '#050c18' }}>
        <Navigation />
      </div>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden pt-20 pb-24 px-5 md:px-8"
        style={{ background: 'linear-gradient(160deg, #f8faff 0%, #eef2ff 40%, #f0f4ff 70%, #f5f0ff 100%)' }}
      >
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 60%)', filter: 'blur(60px)' }} />
        </div>

        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 text-sm text-gray-400 mb-10 font-medium"
          >
            <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <ChevronRight size={13} />
            <span>Solutions</span>
            <ChevronRight size={13} />
            <span className="text-indigo-600 font-semibold">IT</span>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-14 xl:gap-20 items-center">
            {/* Left */}
            <div>
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(59,130,246,0.1))', border: '1px solid rgba(99,102,241,0.2)', color: '#4f46e5' }}>
                <Monitor size={11} strokeWidth={2.5} /> FOR IT TEAMS
              </motion.div>

              <motion.h1 custom={0.1} variants={fadeUp} initial="hidden" animate="visible"
                className="text-4xl sm:text-5xl lg:text-[52px] font-black leading-[1.08] tracking-tight text-gray-900 mb-6">
                Make IT the{' '}
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                  engine of innovation
                </span>
              </motion.h1>

              <motion.p custom={0.2} variants={fadeUp} initial="hidden" animate="visible"
                className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl">
                Automatically document workflows and empower your organization to work consistently and compliantly — freeing IT to focus on what matters most: innovation.
              </motion.p>

              <motion.div custom={0.28} variants={fadeUp} initial="hidden" animate="visible"
                className="flex flex-col gap-2.5 mb-10">
                {[
                  'Auto-generate runbooks from recorded IT workflows',
                  'Reduce support tickets by up to 68%',
                  'Stay compliant with auto-updated security checklists',
                ].map((point) => (
                  <div key={point} className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-indigo-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600 font-medium">{point}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div custom={0.36} variants={fadeUp} initial="hidden" animate="visible"
                className="flex flex-wrap gap-3">
                <motion.button
                  onClick={() => handleCTA('it-documentation', { sourcePage: location.pathname, ctaClicked: 'it_hero_get_started' })}
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-full text-white font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', boxShadow: '0 4px 24px rgba(99,102,241,0.4)' }}
                  whileHover={{ scale: 1.04, boxShadow: '0 8px 36px rgba(99,102,241,0.55)' }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                >
                  Get started <ArrowRight size={15} strokeWidth={2.5} />
                </motion.button>
                <motion.a href="#" onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-semibold text-sm text-gray-700 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Play size={13} fill="currentColor" /> Talk to sales
                </motion.a>
              </motion.div>
            </div>

            {/* Right — illustration */}
            <motion.div custom={0.2} variants={fadeUp} initial="hidden" animate="visible" className="relative lg:pl-6">
              <ITWorkflowIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── LOGO STRIP ── */}
      <section className="py-12 px-5 md:px-8 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm text-gray-400 font-medium mb-8">Trusted by IT leaders at</p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {LOGOS.map((logo) => (
              <motion.span key={logo} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-lg font-black text-gray-200 tracking-tight hover:text-gray-400 transition-colors cursor-default select-none">
                {logo}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#4f46e5' }}>
              WHY IT TEAMS CHOOSE US
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Built for how IT actually works</h2>
            <p className="text-lg text-gray-500 mt-3 max-w-2xl mx-auto">Less firefighting. More innovation.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFITS.map(({ icon: Icon, title, description, gradient, bg, border }, i) => (
              <motion.div key={title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.09, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}
                className={`p-6 rounded-2xl border ${bg} ${border} transition-all duration-200`}>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                  <Icon size={20} className="text-white" strokeWidth={2} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-5 md:px-8" style={{ background: 'linear-gradient(160deg, #eef2ff, #f0f4ff)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#4f46e5' }}>
              HOW IT WORKS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">From captured to deployed in minutes</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-11 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px"
              style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)', opacity: 0.3 }} />
            {STEPS.map(({ icon: Icon, title, description, bg }, i) => (
              <motion.div key={title}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center">
                <div className={`relative w-[88px] h-[88px] rounded-2xl bg-gradient-to-br ${bg} flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon size={34} className="text-white" strokeWidth={1.8} />
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border-2 border-white flex items-center justify-center text-xs font-black shadow-md"
                    style={{ color: '#6366f1' }}>
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASE CARDS ── */}
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">Built for every team</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Avantika Flow AI works across the entire organization.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {USE_CASES.map(({ icon: Icon, team, headline, description, tags, color, bg, border }, i) => (
              <motion.div key={team}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -5, boxShadow: '0 20px 50px rgba(0,0,0,0.09)' }}
                className={`p-7 rounded-2xl bg-gradient-to-br ${bg} border ${border} transition-all duration-200 cursor-pointer group`}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: color, boxShadow: `0 4px 16px ${color}40` }}>
                  <Icon size={20} className="text-white" strokeWidth={2} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color }}>{team}</p>
                <h3 className="text-lg font-black text-gray-900 mb-3 leading-snug">{headline}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{description}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {tags.map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/70 text-gray-600 border border-white">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold group-hover:gap-2.5 transition-all duration-150" style={{ color }}>
                  Learn more <ChevronRight size={13} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="py-16 px-5 md:px-8"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e3a8a 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '68%', label: 'Fewer IT tickets' },
              { value: '94%', label: 'Compliance score' },
              { value: '3×', label: 'Faster onboarding' },
              { value: '45min', label: 'Saved per rollout' },
            ].map(({ value, label }) => (
              <motion.div key={value} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <p className="text-4xl font-black text-white mb-1">{value}</p>
                <p className="text-sm text-white/60 font-medium">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section className="py-24 px-5 md:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-2xl font-semibold text-gray-900 leading-relaxed mb-8 italic">
              "Our IT team used to spend 30% of their time writing documentation. With Avantika Flow AI, that's gone. Now they're shipping features instead of writing runbooks."
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>M</div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Marcus Williams</p>
                <p className="text-sm text-gray-500">VP of Engineering · TechScale Inc.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
              Start shipping faster,<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                document smarter
              </span>
            </h2>
            <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
              Join 5M+ users who use Avantika Flow AI to automate documentation and free their teams to do great work.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <motion.button
                onClick={() => handleCTA('it-documentation', { sourcePage: location.pathname, ctaClicked: 'it_final_get_started' })}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', boxShadow: '0 4px 24px rgba(99,102,241,0.4)' }}
                whileHover={{ scale: 1.05, boxShadow: '0 8px 36px rgba(99,102,241,0.55)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
              >
                Get started free <ArrowRight size={15} strokeWidth={2.5} />
              </motion.button>
              <motion.a href="#" onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-gray-700 font-semibold text-sm bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}>
                Talk to sales
              </motion.a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {['Free forever plan', 'No credit card required', 'Live in minutes'].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-sm text-gray-400">
                  <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" /> {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div style={{ background: '#050c18' }}><Footer /></div>
    </div>
  );
};
