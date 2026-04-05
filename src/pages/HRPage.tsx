import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  GraduationCap, UserPlus, BookOpen, Shield,
  ArrowRight, Sparkles,
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';

const USE_CASES = [
  {
    icon: UserPlus,
    title: 'Employee Onboarding Guides',
    description: 'Standardize first-week experiences with role-based plans and milestone tracking.',
    color: '#22c55e',
    to: '/hr/onboarding-guides',
    cta: 'Launch Onboarding Builder',
  },
  {
    icon: GraduationCap,
    title: 'Training Programs',
    description: 'Build modular learning paths with quizzes and completion analytics.',
    color: '#3b82f6',
    to: '/hr/training-programs',
    cta: 'Launch Training Builder',
  },
  {
    icon: BookOpen,
    title: 'Internal Knowledge Base',
    description: 'Convert SOPs and docs into searchable, standardized institutional knowledge.',
    color: '#a855f7',
    to: '/hr/knowledge-base',
    cta: 'Launch Knowledge Builder',
  },
  {
    icon: Shield,
    title: 'Policy & Compliance SOPs',
    description: 'Enforce policy completion with assignment, alerts, and audit-ready logs.',
    color: '#ef4444',
    to: '/hr/compliance-sops',
    cta: 'Launch Compliance Builder',
  },
];

export const HRPage = () => {
  return (
    <div className="min-h-screen" style={{ background: '#050c18' }}>
      <Navigation />
      <main className="max-w-6xl mx-auto px-6 py-20">
        <section className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)', color: '#f472b6' }}
          >
            <GraduationCap size={12} /> FOR HR & L&D
          </motion.div>
          <h1 className="text-5xl font-black text-white mb-4">Learning, onboarding, and compliance at scale</h1>
          <p className="text-white/55 text-lg max-w-3xl mx-auto">Build intelligent HR workflows that ensure every employee learns, performs, and complies consistently.</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          {USE_CASES.map((uc, i) => {
            const Icon = uc.icon;
            return (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
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
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: `${uc.color}18` }}>
                    <Icon size={20} strokeWidth={1.8} style={{ color: uc.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{uc.title}</h3>
                  <p className="text-white/55 text-sm leading-relaxed mb-4">{uc.description}</p>
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: uc.color }}>
                    {uc.cta} <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </section>

        <section className="rounded-3xl p-8" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(59,130,246,0.1))', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} style={{ color: '#f472b6' }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#f472b6' }}>AI-powered HR automation</span>
          </div>
          <p className="text-white/65">Each workflow includes AI-generated steps, guided execution, assignment controls, progress tracking, and save/publish flows for reusable HR operations.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
};
