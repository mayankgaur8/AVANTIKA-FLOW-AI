import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useSalesInquiry } from '../context/SalesInquiryContext';
import { startGoogleOAuth } from '../lib/oauth';

const BENEFITS = [
  'Free forever plan included',
  'No credit card required',
  'Instant setup — live in minutes',
  'SOC 2 Type II certified',
];

export const CTASection = () => {
  const location = useLocation();
  const { openSales } = useSalesInquiry();
  return (
    <section id="tour-cta" className="relative py-16 sm:py-24 px-4 sm:px-6 md:px-8" style={{ zIndex: 1 }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl p-10 sm:p-16"
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(109,40,217,0.25) 50%, rgba(219,39,119,0.2) 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Background glow effects */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.2) 0%, transparent 70%)' }}
          />

          {/* Animated border glow */}
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ boxShadow: 'inset 0 0 0 1px rgba(139,92,246,0.3)' }}
          />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.55 }}
            >
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{
                  background: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.35)',
                  color: '#c4b5fd',
                }}
              >
                GET STARTED TODAY
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight">
                Ready to transform<br />your workflows?
              </h2>
              <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Join 5M+ users who ship better work, faster.
              </p>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.55 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10"
            >
              {BENEFITS.map((benefit, i) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25 + i * 0.07, duration: 0.4 }}
                  className="flex items-center gap-2.5"
                >
                  <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.78)' }}>
                    {benefit}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35, duration: 0.55 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <motion.button
                onClick={() => startGoogleOAuth({ sourcePage: location.pathname, ctaClicked: 'cta_start_free_trial' })}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white font-bold text-sm select-none"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
                  boxShadow: '0 4px 28px rgba(139,92,246,0.5)',
                }}
                whileHover={{ scale: 1.05, boxShadow: '0 8px 40px rgba(139,92,246,0.7)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
              >
                Start Free Trial <ArrowRight size={15} strokeWidth={2.5} />
              </motion.button>
              <motion.a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  openSales({ sourcePage: location.pathname, ctaClicked: 'cta_schedule_demo' });
                }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white font-semibold text-sm select-none"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(12px)',
                }}
                whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.13)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
              >
                Schedule a demo
              </motion.a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
