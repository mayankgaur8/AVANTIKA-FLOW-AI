import { motion } from 'framer-motion';
import { Zap, Shield, Plug, BarChart3 } from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'Lightning Fast Capture',
    description: 'Turn any workflow into a polished document in seconds with AI-powered auto-capture. No manual writing needed.',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'rgba(245,158,11,0.3)',
    tourId: 'tour-capture',
  },
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description: 'SOC 2 Type II certified with end-to-end encryption, SSO, and advanced access controls built in.',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'rgba(59,130,246,0.3)',
    tourId: 'tour-optimize',
  },
  {
    icon: Plug,
    title: '200+ Integrations',
    description: 'Works with your existing stack — Notion, Confluence, Slack, Salesforce, and everything in between.',
    gradient: 'from-purple-500 to-pink-500',
    glow: 'rgba(139,92,246,0.3)',
    tourId: 'tour-integrations',
  },
  {
    icon: BarChart3,
    title: 'Workflow Intelligence',
    description: 'Real-time analytics surface bottlenecks and optimization opportunities across every process.',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'rgba(16,185,129,0.3)',
    tourId: 'tour-workflow-ai',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
};

export const Features = () => {
  return (
    <section id="tour-features" className="relative py-28 px-5 md:px-8" style={{ zIndex: 1 }}>
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(139,92,246,0.3)',
              color: '#a78bfa',
            }}
          >
            WHY AVANTIKA FLOW AI
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Everything your team needs
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Built for teams that demand speed, security, and simplicity — at any scale.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURES.map(({ icon: Icon, title, description, gradient, glow, tourId }, i) => (
            <motion.div
              key={title}
              id={tourId}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -4, boxShadow: `0 16px 40px ${glow}` }}
              className="group relative p-7 rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Hover gradient glow bg */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 20% 50%, ${glow} 0%, transparent 65%)` }}
              />

              <div className="relative flex items-start gap-5">
                <motion.div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  style={{ boxShadow: `0 4px 20px ${glow}` }}
                >
                  <Icon size={22} className="text-white" strokeWidth={2} />
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
