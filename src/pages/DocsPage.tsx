import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, Search, Code, Zap, Plug, Brain } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';

const SECTIONS = [
  {
    icon: Zap,
    title: 'Getting Started',
    articles: ['Quick start guide', 'Install the browser extension', 'Your first workflow capture', 'Invite team members'],
  },
  {
    icon: Brain,
    title: 'Workflow AI',
    articles: ['AI capture overview', 'Workflow AI settings', 'AI step suggestions', 'Training custom models'],
  },
  {
    icon: Plug,
    title: 'Integrations',
    articles: ['Notion integration', 'Slack integration', 'Confluence setup', 'API authentication'],
  },
  {
    icon: Code,
    title: 'API Reference',
    articles: ['REST API overview', 'Authentication & tokens', 'Workflows endpoint', 'Webhooks'],
  },
];

export function DocsPage() {
  return (
    <PageLayout>
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}
            >
              DOCUMENTATION
            </div>
            <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Documentation</h1>
            <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Everything you need to get the most out of Avantika Flow AI.
            </p>

            {/* Search bar */}
            <div
              className="flex items-center gap-3 max-w-lg mx-auto px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Search size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                type="text"
                placeholder="Search documentation..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
              />
              <kbd
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                ⌘K
              </kbd>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SECTIONS.map(({ icon: Icon, title, articles }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="p-6 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.15)' }}
                  >
                    <Icon size={16} className="text-indigo-400" />
                  </div>
                  <h2 className="text-base font-bold text-white">{title}</h2>
                </div>
                <ul className="space-y-2">
                  {articles.map(article => (
                    <li key={article}>
                      <a
                        href="#"
                        onClick={e => e.preventDefault()}
                        className="flex items-center justify-between group text-sm py-1.5 transition-colors duration-150"
                        style={{ color: 'rgba(255,255,255,0.55)' }}
                      >
                        <span className="flex items-center gap-2 group-hover:text-white transition-colors duration-150">
                          <BookOpen size={12} className="flex-shrink-0" /> {article}
                        </span>
                        <ArrowRight size={12} className="text-white/20 group-hover:text-indigo-400 transition-colors duration-150" />
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
