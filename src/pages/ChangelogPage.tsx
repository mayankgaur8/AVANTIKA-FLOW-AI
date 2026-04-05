import { motion } from 'framer-motion';
import { Sparkles, Zap, Bug, ArrowUpRight } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';

const RELEASES = [
  {
    version: '2.4.0',
    date: 'March 28, 2025',
    badge: 'MAJOR',
    badgeColor: '#6366f1',
    items: [
      { type: 'new', text: 'Workflow AI v2 — 40% faster capture with improved step detection' },
      { type: 'new', text: 'Optimize Agents: AI agents that automatically find and fix workflow inefficiencies' },
      { type: 'new', text: 'Real-time collaboration: see teammates editing workflows live' },
      { type: 'improvement', text: 'Dashboard load time reduced by 60%' },
      { type: 'fix', text: 'Fixed Notion sync occasionally skipping the last step' },
    ],
  },
  {
    version: '2.3.2',
    date: 'March 10, 2025',
    badge: 'PATCH',
    badgeColor: '#10b981',
    items: [
      { type: 'fix', text: 'Fixed Google OAuth token refresh loop on long sessions' },
      { type: 'fix', text: 'Salesforce integration: corrected field mapping for custom objects' },
      { type: 'improvement', text: 'Improved mobile view for workflow viewer' },
    ],
  },
  {
    version: '2.3.0',
    date: 'February 20, 2025',
    badge: 'MINOR',
    badgeColor: '#f59e0b',
    items: [
      { type: 'new', text: 'Template Gallery: 200+ community-contributed templates' },
      { type: 'new', text: 'Zapier integration (beta)' },
      { type: 'new', text: 'Bulk workflow export (PDF, DOCX, HTML)' },
      { type: 'improvement', text: 'AI step naming now uses context from surrounding steps' },
    ],
  },
];

const TYPE_META = {
  new: { icon: Sparkles, color: '#a5b4fc', label: 'New' },
  improvement: { icon: Zap, color: '#34d399', label: 'Improved' },
  fix: { icon: Bug, color: '#fb923c', label: 'Fixed' },
};

export function ChangelogPage() {
  return (
    <PageLayout>
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}
            >
              CHANGELOG
            </div>
            <h1 className="text-5xl font-black text-white mb-4 tracking-tight">What's new</h1>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Every update, improvement, and fix — in one place.
            </p>
          </motion.div>

          <div className="space-y-8">
            {RELEASES.map(({ version, date, badge, badgeColor, items }, i) => (
              <motion.div
                key={version}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.55 }}
                className="p-7 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-lg font-black text-white">v{version}</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${badgeColor}20`, color: badgeColor, border: `1px solid ${badgeColor}40` }}
                  >
                    {badge}
                  </span>
                  <span className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>{date}</span>
                </div>

                <ul className="space-y-3">
                  {items.map(({ type, text }) => {
                    const meta = TYPE_META[type as keyof typeof TYPE_META];
                    const Icon = meta.icon;
                    return (
                      <li key={text} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                          <Icon size={13} style={{ color: meta.color }} />
                          <span className="text-xs font-semibold" style={{ color: meta.color, minWidth: '56px' }}>{meta.label}</span>
                        </div>
                        <span className="leading-relaxed">{text}</span>
                      </li>
                    );
                  })}
                </ul>

                <button
                  className="flex items-center gap-1 mt-5 text-xs font-semibold transition-colors duration-150"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#a5b4fc')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                >
                  Full release notes <ArrowUpRight size={12} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
