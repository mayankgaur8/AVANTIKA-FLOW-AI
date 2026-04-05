import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useProductCTA } from '../hooks/useProductCTA';
import {
  ArrowRight, CheckCircle2, Settings, ShieldCheck, Rocket, TrendingUp,
  ChevronRight, Camera, Zap, Brain, Monitor, Headphones,
  CheckCircle, Clock, BarChart3, Play,
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';

// ─── WORKFLOW ILLUSTRATION ──────────────────────────────────────────────────

const WORKFLOW_STEPS = [
  { label: 'Define process scope', done: true },
  { label: 'Record workflow with AI capture', done: true },
  { label: 'Generate documentation', done: true },
  { label: 'Review & approve', done: true },
  { label: 'Deploy to team', done: false, active: true },
];

const WorkflowIllustration = () => (
  <div className="relative w-full max-w-md mx-auto lg:mx-0">
    {/* Glow backdrop */}
    <div
      className="absolute inset-0 rounded-3xl blur-3xl pointer-events-none"
      style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.1) 50%, transparent 70%)', transform: 'scale(1.2)' }}
    />

    {/* Main workflow card */}
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
      style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.13), 0 8px 20px rgba(59,130,246,0.06)' }}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
        >
          <Settings size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">Q4 Operations Playbook</p>
          <p className="text-xs text-gray-400">3 contributors · Updated 2h ago</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex-shrink-0">
          Live
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500 font-medium">Completion</span>
          <span className="text-xs font-bold text-blue-600">80%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '80%' }}
            transition={{ delay: 0.9, duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-gray-50">
        {WORKFLOW_STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
            className={`flex items-center gap-3 px-5 py-3 ${step.active ? 'bg-blue-50/60' : ''}`}
          >
            <div className="flex-shrink-0">
              {step.done ? (
                <CheckCircle size={16} className="text-emerald-500" fill="currentColor" />
              ) : step.active ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                </motion.div>
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
              )}
            </div>
            <span className={`text-sm flex-1 ${step.done ? 'text-gray-500' : step.active ? 'text-blue-700 font-semibold' : 'text-gray-400'}`}>
              {step.label}
            </span>
            <span className="text-[10px] font-semibold text-gray-300">0{i + 1}</span>
          </motion.div>
        ))}
      </div>

      {/* Card footer — AI caption */}
      <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-violet-50 flex items-center gap-2">
        <Zap size={13} className="text-violet-500 flex-shrink-0" />
        <p className="text-xs text-violet-700 font-medium">AI generated 247 steps automatically</p>
      </div>
    </motion.div>

    {/* Floating metric — top-left */}
    <motion.div
      initial={{ opacity: 0, x: -20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute -left-6 top-8 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100"
      style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
    >
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-blue-500" />
        <div>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Time saved</p>
          <p className="text-lg font-black text-gray-900 leading-tight">3.2h <span className="text-xs font-medium text-gray-400">/wk</span></p>
        </div>
      </div>
    </motion.div>

    {/* Floating metric — bottom-right */}
    <motion.div
      initial={{ opacity: 0, x: 20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: 1.0, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute -right-6 bottom-8 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100"
      style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
    >
      <div className="flex items-center gap-2">
        <BarChart3 size={14} className="text-emerald-500" />
        <div>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Error reduction</p>
          <p className="text-lg font-black text-gray-900 leading-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #10b981, #3b82f6)' }}
            >
              ↓ 91%
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  </div>
);

// ─── BENEFITS ──────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: Settings,
    title: 'Standardize processes',
    description: 'Every workflow becomes a consistent, repeatable system. No more tribal knowledge or version confusion.',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: ShieldCheck,
    title: 'Reduce operational errors',
    description: 'AI-verified steps and automatic checks eliminate the mistakes that cost you time, money, and reputation.',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: Rocket,
    title: 'Improve onboarding speed',
    description: 'New team members get up to speed 3× faster with auto-generated, role-specific process guides.',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  {
    icon: TrendingUp,
    title: 'Increase team efficiency',
    description: 'Identify bottlenecks with AI-driven analytics and surface exactly where your process breaks down.',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
];

// ─── HOW IT WORKS ──────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    icon: Camera,
    title: 'Capture workflows',
    description: 'Record any process — in any tool — with one click. Avantika Flow AI watches, understands, and captures every step automatically.',
    color: '#3b82f6',
    bg: 'from-blue-500 to-blue-600',
  },
  {
    number: '02',
    icon: Brain,
    title: 'Convert into SOPs',
    description: 'Our AI transforms raw recordings into clean, structured Standard Operating Procedures — complete with screenshots, annotations, and branching logic.',
    color: '#8b5cf6',
    bg: 'from-violet-500 to-purple-600',
  },
  {
    number: '03',
    icon: Zap,
    title: 'Optimize using AI',
    description: 'Continuously improve. Avantika Flow AI identifies inefficiencies, flags outdated steps, and suggests optimizations based on how your team actually works.',
    color: '#ec4899',
    bg: 'from-pink-500 to-rose-600',
  },
];

// ─── USE CASE CARDS ──────────────────────────────────────────────────────────

const USE_CASES = [
  {
    icon: Settings,
    team: 'Operations teams',
    headline: 'Run ops with zero ambiguity',
    description: 'Document every repeatable process — from procurement to vendor management — and make sure the whole org executes consistently.',
    tags: ['SOPs', 'Process docs', 'Runbooks'],
    color: '#3b82f6',
    bg: 'from-blue-50 to-indigo-50',
    border: 'border-blue-100',
  },
  {
    icon: Monitor,
    team: 'IT teams',
    headline: 'Onboard tools in hours, not weeks',
    description: 'Create step-by-step implementation guides and troubleshooting playbooks that make every software rollout smooth.',
    tags: ['IT runbooks', 'Setup guides', 'Incident response'],
    color: '#8b5cf6',
    bg: 'from-violet-50 to-purple-50',
    border: 'border-violet-100',
  },
  {
    icon: Headphones,
    team: 'Support teams',
    headline: 'Resolve issues faster, every time',
    description: 'Give your support agents instant access to up-to-date resolution playbooks and escalation procedures at their fingertips.',
    tags: ['Resolution guides', 'Escalation flows', 'FAQ docs'],
    color: '#10b981',
    bg: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-100',
  },
];

// ─── LOGO STRIP (stylised text logos) ────────────────────────────────────────

const LOGOS = ['Stripe', 'Notion', 'Salesforce', 'Atlassian', 'HubSpot', 'Figma'];

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { delay: d, duration: 0.65, ease: [0.16, 1, 0.3, 1] } }),
};

export const OperationsPage = () => {
  const location = useLocation();
  const { handleCTA } = useProductCTA();
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Shared dark navbar */}
      <div style={{ background: '#050c18' }}>
        <Navigation />
      </div>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden pt-20 pb-24 px-5 md:px-8"
        style={{
          background: 'linear-gradient(160deg, #f8faff 0%, #f0f4ff 40%, #f5f0ff 70%, #fff5fb 100%)',
        }}
      >
        {/* Subtle bg blobs */}
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none overflow-hidden">
          <div
            className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 60%)', filter: 'blur(60px)' }}
          />
          <div
            className="absolute bottom-0 right-[10%] w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 60%)', filter: 'blur(60px)' }}
          />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 text-sm text-gray-400 mb-10 font-medium"
          >
            <Link to="/" className="hover:text-blue-600 transition-colors duration-150">Home</Link>
            <ChevronRight size={13} />
            <span className="text-gray-400">Solutions</span>
            <ChevronRight size={13} />
            <span className="text-blue-600 font-semibold">Operations</span>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-14 xl:gap-20 items-center">
            {/* Left — copy */}
            <div>
              <motion.div
                custom={0}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
                  border: '1px solid rgba(139,92,246,0.2)',
                  color: '#7c3aed',
                }}
              >
                <Settings size={11} strokeWidth={2.5} />
                FOR OPERATIONS TEAMS
              </motion.div>

              <motion.h1
                custom={0.1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-4xl sm:text-5xl lg:text-[52px] font-black leading-[1.08] tracking-tight text-gray-900 mb-6"
              >
                The best operations teams{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                >
                  don't leave processes to chance
                </span>
              </motion.h1>

              <motion.p
                custom={0.2}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl"
              >
                Automatically document workflows and ensure consistency across teams — reducing errors, improving compliance, and accelerating execution.
              </motion.p>

              {/* Proof points */}
              <motion.div
                custom={0.28}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-2.5 mb-10"
              >
                {[
                  'Auto-generate SOPs from recorded workflows',
                  'Keep processes updated with AI monitoring',
                  'Integrate with 200+ tools your team already uses',
                ].map((point) => (
                  <div key={point} className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600 font-medium">{point}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                custom={0.36}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap gap-3"
              >
                <motion.button
                  onClick={() => handleCTA('sop-creation', { sourcePage: location.pathname, ctaClicked: 'operations_hero_get_started' })}
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-full text-white font-bold text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    boxShadow: '0 4px 24px rgba(99,102,241,0.4)',
                  }}
                  whileHover={{ scale: 1.04, boxShadow: '0 8px 36px rgba(99,102,241,0.55)' }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                >
                  Get started <ArrowRight size={15} strokeWidth={2.5} />
                </motion.button>
                <motion.a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-semibold text-sm text-gray-700 bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-colors duration-150"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                >
                  <Play size={13} fill="currentColor" /> Talk to sales
                </motion.a>
              </motion.div>
            </div>

            {/* Right — workflow illustration */}
            <motion.div
              custom={0.2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="relative lg:pl-6"
            >
              <WorkflowIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── LOGO STRIP ── */}
      <section className="py-12 px-5 md:px-8 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm text-gray-400 font-medium mb-8">
            Trusted by operations leaders at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {LOGOS.map((logo) => (
              <motion.span
                key={logo}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-lg font-black text-gray-200 tracking-tight hover:text-gray-400 transition-colors duration-200 cursor-default select-none"
              >
                {logo}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.2)',
                color: '#2563eb',
              }}
            >
              WHY OPERATIONS TEAMS CHOOSE US
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Built for how operations actually work
            </h2>
            <p className="text-lg text-gray-500 mt-3 max-w-2xl mx-auto">
              Stop relying on tribal knowledge. Build systems your entire team can follow.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFITS.map(({ icon: Icon, title, description, color, bg, border }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.09, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}
                className={`p-6 rounded-2xl border ${bg} ${border} transition-all duration-200`}
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}
                  style={{ boxShadow: `0 4px 14px color-mix(in srgb, currentColor 30%, transparent)` }}
                >
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
      <section className="py-24 px-5 md:px-8" style={{ background: 'linear-gradient(160deg, #f8faff, #f3f0ff)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.2)',
                color: '#7c3aed',
              }}
            >
              HOW IT WORKS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              From chaos to clarity in 3 steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop only) */}
            <div
              className="hidden md:block absolute top-11 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px"
              style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)', opacity: 0.3 }}
            />

            {STEPS.map(({ number, icon: Icon, title, description, bg }, i) => (
              <motion.div
                key={number}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center"
              >
                {/* Step icon circle */}
                <div
                  className={`relative w-[88px] h-[88px] rounded-2xl bg-gradient-to-br ${bg} flex items-center justify-center mb-6 shadow-lg`}
                  style={{
                    boxShadow: `0 8px 28px rgba(0,0,0,0.12)`,
                  }}
                >
                  <Icon size={34} className="text-white" strokeWidth={1.8} />
                  <div
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border-2 border-white flex items-center justify-center text-xs font-black shadow-md"
                    style={{ color: bg.includes('blue') ? '#3b82f6' : bg.includes('violet') ? '#8b5cf6' : '#ec4899' }}
                  >
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">
              Built for every team
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Avantika Flow AI works across the entire organization — wherever there are processes to capture.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {USE_CASES.map(({ icon: Icon, team, headline, description, tags, color, bg, border }, i) => (
              <motion.div
                key={team}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -5, boxShadow: '0 20px 50px rgba(0,0,0,0.09)' }}
                className={`p-7 rounded-2xl bg-gradient-to-br ${bg} border ${border} transition-all duration-200 cursor-pointer group`}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: color, boxShadow: `0 4px 16px ${color}40` }}
                >
                  <Icon size={20} className="text-white" strokeWidth={2} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color }}>
                  {team}
                </p>
                <h3 className="text-lg font-black text-gray-900 mb-3 leading-snug">{headline}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{description}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/70 text-gray-600 border border-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div
                  className="flex items-center gap-1.5 text-xs font-bold group-hover:gap-2.5 transition-all duration-150"
                  style={{ color }}
                >
                  Learn more <ChevronRight size={13} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section
        className="py-16 px-5 md:px-8"
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4c1d95 50%, #831843 100%)' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10×', label: 'Faster SOP creation' },
              { value: '91%', label: 'Error reduction' },
              { value: '3×', label: 'Faster onboarding' },
              { value: '50K+', label: 'Processes per week' },
            ].map(({ value, label }) => (
              <motion.div
                key={value}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-2xl font-semibold text-gray-900 leading-relaxed mb-8 italic">
              "Avantika Flow AI cut our onboarding time from 3 weeks to 3 days. Our ops team documented 180 processes in the first month — something that would have taken us a year manually."
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
              >
                S
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Sarah Chen</p>
                <p className="text-sm text-gray-500">Head of Operations · Acme Corp</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
              Start building better
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
              >
                operations today
              </span>
            </h2>
            <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
              Join 5M+ users who use Avantika Flow AI to capture, standardize, and optimize their workflows.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <motion.button
                onClick={() => handleCTA('sop-creation', { sourcePage: location.pathname, ctaClicked: 'operations_final_get_started' })}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  boxShadow: '0 4px 24px rgba(99,102,241,0.4)',
                }}
                whileHover={{ scale: 1.05, boxShadow: '0 8px 36px rgba(99,102,241,0.55)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
              >
                Get started free <ArrowRight size={15} strokeWidth={2.5} />
              </motion.button>
              <motion.a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-gray-700 font-semibold text-sm bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-colors"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
              >
                Talk to sales
              </motion.a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {['Free forever plan', 'No credit card required', 'Live in minutes'].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-sm text-gray-400">
                  <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dark footer */}
      <div style={{ background: '#050c18' }}>
        <Footer />
      </div>
    </div>
  );
};
