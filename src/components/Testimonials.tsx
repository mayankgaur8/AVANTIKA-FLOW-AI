import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote:
      'Avantika Flow AI cut our onboarding time in half. New hires now get a step-by-step guide for every process on day one — no hand-holding needed.',
    author: 'Sarah Chen',
    role: 'Head of Operations',
    company: 'Meridian Labs',
    avatar: 'SC',
    accent: '#60a5fa',
  },
  {
    quote:
      'We used to spend 3 hours writing SOPs for every process. Now it takes 3 minutes. The AI descriptions are shockingly good.',
    author: 'Marcus Williams',
    role: 'IT Director',
    company: 'Vantage Health',
    avatar: 'MW',
    accent: '#a78bfa',
  },
  {
    quote:
      'Our customer success team uses it to build product walkthroughs that actually get read. Engagement went up 60% after switching from Confluence docs.',
    author: 'Priya Kapoor',
    role: 'VP Customer Success',
    company: 'Orion SaaS',
    avatar: 'PK',
    accent: '#f472b6',
  },
  {
    quote:
      'The analytics showed us that step 7 in our approval workflow was causing 40% of our errors. We fixed it in an hour. That insight alone saved us thousands.',
    author: 'James Park',
    role: 'COO',
    company: 'Helix Commerce',
    avatar: 'JP',
    accent: '#34d399',
  },
  {
    quote:
      'We embedded Flow AI guides directly in our Notion wiki. The team actually uses the documentation now — that never happened before.',
    author: 'Lena Müller',
    role: 'Engineering Manager',
    company: 'Stackline',
    avatar: 'LM',
    accent: '#fb923c',
  },
  {
    quote:
      "Rolled out to 200 employees across 4 countries. Everyone's running off the same playbooks. Consistency has never been this easy to achieve.",
    author: 'David Torres',
    role: 'Global Ops Lead',
    company: 'Nexus Partners',
    avatar: 'DT',
    accent: '#38bdf8',
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5 mb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
      ))}
    </div>
  );
}

export const Testimonials = () => {
  return (
    <section className="relative py-28 px-5 md:px-8" style={{ zIndex: 1 }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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
              background: 'rgba(251,191,36,0.10)',
              border: '1px solid rgba(251,191,36,0.25)',
              color: '#fbbf24',
            }}
          >
            WHAT TEAMS SAY
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Loved by operations teams
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.52)' }}>
            Join thousands of teams who document, train, and scale without the busywork.
          </p>
        </motion.div>

        {/* Quote grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ quote, author, role, company, avatar, accent }, i) => (
            <motion.div
              key={author}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4 }}
              className="relative flex flex-col p-6 rounded-2xl transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Left accent bar */}
              <div
                className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full"
                style={{ background: `linear-gradient(180deg, ${accent}, transparent)` }}
              />

              <StarRating />

              <p className="text-sm leading-relaxed flex-1 mb-6" style={{ color: 'rgba(255,255,255,0.72)' }}>
                "{quote}"
              </p>

              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `${accent}20`, color: accent }}
                >
                  {avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{author}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.42)' }}>
                    {role} · {company}
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
