import { motion } from 'framer-motion';
import { Shield, CheckCircle2 } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';

const RIGHTS = [
  { right: 'Right to Access', desc: 'You can request a copy of all personal data we hold about you.' },
  { right: 'Right to Rectification', desc: 'You can request that we correct inaccurate personal data.' },
  { right: 'Right to Erasure', desc: '"Right to be forgotten" — request deletion of your personal data.' },
  { right: 'Right to Restriction', desc: 'Request we limit processing of your data in certain circumstances.' },
  { right: 'Right to Portability', desc: 'Receive your data in a machine-readable format.' },
  { right: 'Right to Object', desc: 'Object to processing based on legitimate interests or direct marketing.' },
];

const MEASURES = [
  'Data minimization — we only collect what we need',
  'Privacy by design in all product development',
  'Data Processing Agreements (DPAs) with all sub-processors',
  'EU Standard Contractual Clauses for international transfers',
  'Annual third-party security audits and penetration testing',
  'Data breach notification within 72 hours as required',
  'Appointed Data Protection Officer (DPO)',
];

export function GDPRPage() {
  return (
    <PageLayout>
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Shield size={18} className="text-indigo-400" />
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                GDPR COMPLIANCE
              </span>
            </div>
            <h1 className="text-4xl font-black text-white mb-3">GDPR & Data Protection</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Last updated: March 28, 2025</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl mb-10"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Avantika Flow AI is committed to full compliance with the General Data Protection Regulation (GDPR). As a controller and/or processor of EU personal data, we take our obligations seriously and have implemented comprehensive measures to protect your rights.
            </p>
          </motion.div>

          {/* Your rights */}
          <h2 className="text-2xl font-black text-white mb-6">Your GDPR Rights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {RIGHTS.map(({ right, desc }, i) => (
              <motion.div
                key={right}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className="flex items-start gap-3 p-5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{right}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Technical measures */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-7 rounded-2xl mb-8"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <h2 className="text-xl font-bold text-white mb-4">Our Compliance Measures</h2>
            <ul className="space-y-2.5">
              {MEASURES.map(m => (
                <li key={m} className="flex items-start gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  {m}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* DPA + Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="text-base font-bold text-white mb-2">Data Processing Agreement</h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Need a DPA for your organization? Download our standard DPA template.</p>
              <button className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Download DPA →</button>
            </div>
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <h3 className="text-base font-bold text-white mb-2">Contact Our DPO</h3>
              <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>For data subject requests or GDPR inquiries:</p>
              <a href="mailto:dpo@avantikaflow.ai" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                dpo@avantikaflow.ai
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
