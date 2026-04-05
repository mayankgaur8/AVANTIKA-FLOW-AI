import { motion } from 'framer-motion';
import { MousePointerClick, Wand2, Share2 } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: MousePointerClick,
    title: 'Capture any process',
    description:
      'Click record and go through your workflow as you normally would. Avantika Flow AI automatically captures every step with a screenshot.',
    accent: '#60a5fa',
    glow: 'rgba(96,165,250,0.15)',
  },
  {
    number: '02',
    icon: Wand2,
    title: 'AI builds the guide',
    description:
      'Our AI instantly turns your recording into a polished, step-by-step guide — complete with annotations, titles, and descriptions.',
    accent: '#a78bfa',
    glow: 'rgba(167,139,250,0.15)',
  },
  {
    number: '03',
    icon: Share2,
    title: 'Share in one click',
    description:
      'Share a link, embed it in Notion or Confluence, or export to PDF. Your team gets the knowledge they need, instantly.',
    accent: '#f472b6',
    glow: 'rgba(244,114,182,0.15)',
  },
];

export const HowItWorks = () => {
  return (
    <section className="relative py-28 px-5 md:px-8" style={{ zIndex: 1 }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{
              background: 'rgba(96,165,250,0.10)',
              border: '1px solid rgba(96,165,250,0.25)',
              color: '#93c5fd',
            }}
          >
            HOW IT WORKS
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            From action to guide in seconds
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.52)' }}>
            Three simple steps — no writing, no screenshots, no formatting. Just results.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Connector line (desktop) */}
          <div
            className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px"
            style={{ background: 'linear-gradient(90deg, rgba(96,165,250,0.3), rgba(167,139,250,0.3), rgba(244,114,182,0.3))' }}
            aria-hidden="true"
          />

          {STEPS.map(({ number, icon: Icon, title, description, accent, glow }, i) => (
            <motion.div
              key={number}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step number bubble */}
              <div
                className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{
                  background: glow,
                  border: `1px solid ${accent}33`,
                  boxShadow: `0 0 32px ${glow}`,
                }}
              >
                <Icon size={28} style={{ color: accent }} strokeWidth={1.8} />
                <span
                  className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                  style={{
                    background: accent,
                    color: '#050c18',
                    boxShadow: `0 2px 12px ${glow}`,
                  }}
                >
                  {i + 1}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.52)' }}>
                {description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
