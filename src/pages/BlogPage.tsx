import { motion } from 'framer-motion';
import { ArrowRight, Clock, User } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';

const POSTS = [
  {
    tag: 'PRODUCT',
    tagColor: '#6366f1',
    tagBg: 'rgba(99,102,241,0.12)',
    title: '10 Workflow Templates Every Ops Team Needs in 2025',
    excerpt: 'From employee onboarding to incident response — the most-used templates by our top 10k teams, available free.',
    author: 'Priya Nair',
    date: 'Mar 28, 2025',
    readTime: '6 min read',
    gradient: 'from-indigo-500/20 to-purple-500/20',
  },
  {
    tag: 'AI',
    tagColor: '#10b981',
    tagBg: 'rgba(16,185,129,0.12)',
    title: 'How AI Is Rewriting the Rules of Business Process Management',
    excerpt: 'LLMs aren\'t just automating workflows — they\'re discovering inefficiencies humans never noticed. Here\'s what that means for your team.',
    author: 'Rohan Mehta',
    date: 'Mar 15, 2025',
    readTime: '9 min read',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    tag: 'GUIDE',
    tagColor: '#f59e0b',
    tagBg: 'rgba(245,158,11,0.12)',
    title: 'The Complete Guide to SOPs That Teams Actually Follow',
    excerpt: 'Most SOPs fail because they\'re built to check a compliance box, not to help people do their jobs. Here\'s how to build ones that stick.',
    author: 'Avantika Sharma',
    date: 'Mar 3, 2025',
    readTime: '12 min read',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    tag: 'CASE STUDY',
    tagColor: '#3b82f6',
    tagBg: 'rgba(59,130,246,0.12)',
    title: 'How Acme Corp Cut Onboarding Time from 3 Weeks to 3 Days',
    excerpt: 'A behind-the-scenes look at how their HR team used Avantika Flow AI to transform their new hire experience — and the metrics that followed.',
    author: 'Alex Kim',
    date: 'Feb 20, 2025',
    readTime: '5 min read',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    tag: 'ENGINEERING',
    tagColor: '#ec4899',
    tagBg: 'rgba(236,72,153,0.12)',
    title: 'Building Real-Time Workflow Analytics at Scale',
    excerpt: 'The architectural decisions behind our new analytics engine — processing 50M+ events per day without breaking a sweat.',
    author: 'James Liu',
    date: 'Feb 8, 2025',
    readTime: '10 min read',
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  {
    tag: 'DESIGN',
    tagColor: '#a78bfa',
    tagBg: 'rgba(167,139,250,0.12)',
    title: 'Designing for Flow: How We Reimagined the Workflow Canvas',
    excerpt: 'The UX research, design sprints, and user feedback that shaped our biggest UI update yet.',
    author: 'Sofia Torres',
    date: 'Jan 22, 2025',
    readTime: '7 min read',
    gradient: 'from-violet-500/20 to-purple-500/20',
  },
];

export function BlogPage() {
  return (
    <PageLayout>
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
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
              BLOG
            </div>
            <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Insights & Ideas</h1>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Workflow intelligence, product updates, and team ops perspectives.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {POSTS.map(({ tag, tagColor, tagBg, title, excerpt, author, date, readTime, gradient }, i) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl overflow-hidden cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Thumbnail */}
                <div
                  className={`h-36 flex items-center justify-center bg-gradient-to-br ${gradient} relative`}
                >
                  <div
                    className="text-xs font-bold px-2.5 py-1 rounded-full absolute top-3 left-3"
                    style={{ background: tagBg, color: tagColor, border: `1px solid ${tagColor}40` }}
                  >
                    {tag}
                  </div>
                </div>

                <div className="p-5">
                  <h2 className="text-base font-bold text-white mb-2 leading-snug group-hover:text-indigo-300 transition-colors duration-150">
                    {title}
                  </h2>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      <span className="flex items-center gap-1"><User size={11} /> {author}</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {readTime}</span>
                    </div>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{date}</span>
                  </div>

                  <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-indigo-400 group-hover:gap-2 transition-all duration-150">
                    Read article <ArrowRight size={12} />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
