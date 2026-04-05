import { motion } from 'framer-motion';
import { Zap, Brain, GitBranch, BarChart3 } from 'lucide-react';

const FEATURES = [
  {
    badge: 'CAPTURE',
    icon: Zap,
    accent: '#60a5fa',
    glow: 'rgba(96,165,250,0.12)',
    title: 'Record any workflow in one click',
    description:
      'Just hit record and go through your process. Avantika Flow AI captures every click, keystroke, and screen state — automatically generating a polished guide without any manual work.',
    bullets: ['Auto-screenshot every step', 'Redact sensitive data automatically', 'Works in any browser or app'],
    mockupRows: [
      { label: 'Step 1 · Open CRM dashboard', done: true },
      { label: 'Step 2 · Click "New Contact"', done: true },
      { label: 'Step 3 · Fill contact details', done: true },
      { label: 'Step 4 · Save and assign to team', done: false },
    ],
  },
  {
    badge: 'AI OPTIMIZE',
    icon: Brain,
    accent: '#a78bfa',
    glow: 'rgba(167,139,250,0.12)',
    title: 'AI rewrites and enriches every guide',
    description:
      'Our AI reviews your captured steps, fills in missing context, rewrites unclear instructions, and adds structured tips — so every guide reads like it was written by your best employee.',
    bullets: ['Auto-generated step descriptions', 'Smart gap detection', 'Brand voice consistency'],
    mockupRows: [
      { label: 'Clarity score: 94/100', done: true },
      { label: '3 steps rewritten by AI', done: true },
      { label: 'Sensitive fields redacted', done: true },
      { label: 'Exported to Notion & Confluence', done: false },
    ],
    flip: true,
  },
  {
    badge: 'WORKFLOW AI',
    icon: GitBranch,
    accent: '#f472b6',
    glow: 'rgba(244,114,182,0.12)',
    title: 'Chain guides into full workflows',
    description:
      'Connect individual guides into multi-step workflows with branching logic, conditional steps, and role-based routing. Build SOPs that actually adapt to your team.',
    bullets: ['Drag-and-drop workflow builder', 'Conditional branching logic', 'Role-based step assignments'],
    mockupRows: [
      { label: 'Onboarding flow · 12 guides', done: true },
      { label: 'IT provisioning · 8 guides', done: true },
      { label: 'Q4 ops runbook · 22 guides', done: false },
      { label: 'Draft: Sales playbook', done: false },
    ],
  },
  {
    badge: 'ANALYTICS',
    icon: BarChart3,
    accent: '#34d399',
    glow: 'rgba(52,211,153,0.12)',
    title: 'See exactly where teams get stuck',
    description:
      'Real-time analytics show you which steps take the longest, where people drop off, and which guides drive the most value — so you can continuously improve your processes.',
    bullets: ['Step-by-step completion rates', 'Bottleneck detection', 'ROI reporting per workflow'],
    mockupRows: [
      { label: 'Avg completion: 87%', done: true },
      { label: 'Top guide: CRM onboarding', done: true },
      { label: 'Drop-off at step 6 detected', done: false },
      { label: 'Weekly digest sent to admin', done: true },
    ],
    flip: true,
  },
];

function MockupWindow({ rows, accent }: { rows: { label: string; done: boolean }[]; accent: string }) {
  return (
    <div
      className="rounded-2xl overflow-hidden w-full"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
      >
        <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
        <div
          className="flex-1 mx-4 h-6 rounded-lg flex items-center px-3"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>app.avantikaflow.ai</span>
        </div>
      </div>

      {/* Content rows */}
      <div className="p-5 space-y-3">
        {rows.map(({ label, done }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: done ? `${accent}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${done ? `${accent}25` : 'rgba(255,255,255,0.05)'}` }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ background: done ? accent : 'rgba(255,255,255,0.08)', color: done ? '#050c18' : 'rgba(255,255,255,0.3)' }}
            >
              {done ? '✓' : i + 1}
            </span>
            <span className="text-sm" style={{ color: done ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)' }}>
              {label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export const FeatureShowcase = () => {
  return (
    <section className="relative py-12 px-5 md:px-8" style={{ zIndex: 1 }}>
      <div className="max-w-6xl mx-auto space-y-32">
        {FEATURES.map(({ badge, icon: Icon, accent, glow, title, description, bullets, mockupRows, flip }, idx) => (
          <motion.div
            key={badge}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${flip ? 'lg:flex lg:flex-row-reverse' : ''}`}
          >
            {/* Text side */}
            <div className={flip ? 'lg:pl-0' : ''}>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-5"
                style={{ background: `${accent}15`, border: `1px solid ${accent}30`, color: accent }}
              >
                <Icon size={11} strokeWidth={2.5} />
                {badge}
              </div>

              <h3 className="text-3xl sm:text-4xl font-black text-white mb-5 tracking-tight leading-tight">
                {title}
              </h3>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {description}
              </p>

              <ul className="space-y-3">
                {bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-3">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: `${accent}20`, color: accent }}
                    >
                      ✓
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mockup side */}
            <div
              className="relative"
              style={{ filter: `drop-shadow(0 0 60px ${glow})` }}
            >
              <MockupWindow rows={mockupRows} accent={accent} />

              {/* Floating accent dot */}
              <motion.div
                className="absolute -top-4 -right-4 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)` }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 4 + idx, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
