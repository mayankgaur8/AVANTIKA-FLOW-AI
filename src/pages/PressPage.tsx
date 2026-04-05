import { motion } from 'framer-motion';
import { Download, ExternalLink, Mail } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';

const COVERAGE = [
  { outlet: 'TechCrunch', headline: 'Avantika Flow AI raises $18M to bring AI-native process documentation to enterprise teams', date: 'Feb 2025' },
  { outlet: 'The Verge', headline: 'This startup wants to be the Notion for business processes — and AI is the difference', date: 'Jan 2025' },
  { outlet: 'Forbes', headline: 'Avantika Flow AI named to Forbes AI 50: Most Promising Artificial Intelligence Companies', date: 'Dec 2024' },
  { outlet: 'VentureBeat', headline: 'How Avantika Flow AI uses LLMs to auto-generate SOPs from screen recordings', date: 'Nov 2024' },
];

export function PressPage() {
  return (
    <PageLayout>
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-5xl mx-auto">
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
              PRESS
            </div>
            <h1 className="text-5xl font-black text-white mb-4 tracking-tight">In the news</h1>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Press coverage, announcements, and media resources.
            </p>
          </motion.div>

          {/* Press Coverage */}
          <div className="space-y-4 mb-16">
            {COVERAGE.map(({ outlet, headline, date }, i) => (
              <motion.div
                key={headline}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                whileHover={{ x: 4 }}
                className="group flex items-center justify-between p-5 rounded-2xl cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                      {outlet}
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{date}</span>
                  </div>
                  <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors duration-150">
                    {headline}
                  </p>
                </div>
                <ExternalLink size={15} className="text-white/20 group-hover:text-indigo-400 ml-4 flex-shrink-0 transition-colors duration-150" />
              </motion.div>
            ))}
          </div>

          {/* Media Kit + Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-7 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <h3 className="text-lg font-bold text-white mb-2">Media Kit</h3>
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Download logos, screenshots, brand guidelines, and executive headshots.
              </p>
              <button
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <Download size={14} /> Download Media Kit
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-7 rounded-2xl"
              style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
            >
              <h3 className="text-lg font-bold text-white mb-2">Press Inquiries</h3>
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                For interviews, quotes, or press requests, reach out to our communications team.
              </p>
              <a
                href="mailto:press@avantikaflow.ai"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <Mail size={14} /> press@avantikaflow.ai
              </a>
            </motion.div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
