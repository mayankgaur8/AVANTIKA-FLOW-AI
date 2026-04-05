import { motion } from 'framer-motion';
import { ArrowRight, Copy } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { useToast } from '../context/ToastContext';

const TEMPLATES = [
  { name: 'Employee Onboarding', category: 'HR', uses: '24k', gradient: 'from-blue-500/20 to-indigo-500/20', color: '#60a5fa' },
  { name: 'Incident Response', category: 'IT Ops', uses: '18k', gradient: 'from-red-500/20 to-orange-500/20', color: '#f87171' },
  { name: 'Sales Demo Checklist', category: 'Sales', uses: '15k', gradient: 'from-emerald-500/20 to-teal-500/20', color: '#34d399' },
  { name: 'Bug Triage Process', category: 'Engineering', uses: '12k', gradient: 'from-purple-500/20 to-pink-500/20', color: '#a78bfa' },
  { name: 'Customer Success QBR', category: 'CS', uses: '9k', gradient: 'from-amber-500/20 to-orange-500/20', color: '#fbbf24' },
  { name: 'Sprint Planning', category: 'Engineering', uses: '21k', gradient: 'from-cyan-500/20 to-blue-500/20', color: '#22d3ee' },
  { name: 'Finance Month Close', category: 'Finance', uses: '7k', gradient: 'from-rose-500/20 to-pink-500/20', color: '#fb7185' },
  { name: 'Marketing Campaign Launch', category: 'Marketing', uses: '11k', gradient: 'from-violet-500/20 to-purple-500/20', color: '#8b5cf6' },
];

const CATEGORIES = ['All', 'HR', 'Engineering', 'Sales', 'IT Ops', 'Finance', 'Marketing', 'CS'];

export function TemplatesPage() {
  const { addToast } = useToast();

  return (
    <PageLayout>
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
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
              TEMPLATE GALLERY
            </div>
            <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Browse Templates</h1>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Proven workflow templates from the world's best teams. Copy and customize in seconds.
            </p>
          </motion.div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                style={cat === 'All' ? {
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                } : {
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          {/* Template grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEMPLATES.map(({ name, category, uses, gradient, color }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl overflow-hidden cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className={`h-28 bg-gradient-to-br ${gradient} flex items-end p-3`}>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.3)', color }}
                  >
                    {category}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors duration-150">
                    {name}
                  </h3>
                  <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>{uses} teams using</p>
                  <button
                    onClick={() => addToast(`"${name}" template copied to clipboard!`, 'success')}
                    className="flex items-center gap-1.5 text-xs font-semibold transition-colors duration-150"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#a5b4fc')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                  >
                    <Copy size={11} /> Use template <ArrowRight size={11} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
