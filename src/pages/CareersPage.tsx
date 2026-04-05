import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Briefcase, Heart, Zap } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';

const PERKS = [
  { icon: Heart, title: 'Health & Wellness', desc: 'Full medical, dental, vision. $1,000/year wellness stipend.' },
  { icon: Zap, title: 'Remote-First', desc: 'Work from anywhere. We have team members in 18 countries.' },
  { icon: Briefcase, title: 'Equity for Everyone', desc: 'Every employee gets meaningful equity from day one.' },
  { icon: MapPin, title: 'Team Retreats', desc: 'Twice-yearly full-team retreats in amazing locations.' },
];

const OPENINGS = [
  { title: 'Senior Full-Stack Engineer', dept: 'Engineering', location: 'Remote', type: 'Full-time' },
  { title: 'AI/ML Engineer', dept: 'Engineering', location: 'Remote', type: 'Full-time' },
  { title: 'Product Designer (Senior)', dept: 'Design', location: 'Remote / SF', type: 'Full-time' },
  { title: 'Product Manager — Platform', dept: 'Product', location: 'Remote', type: 'Full-time' },
  { title: 'Enterprise Account Executive', dept: 'Sales', location: 'NY / Remote', type: 'Full-time' },
  { title: 'Customer Success Manager', dept: 'Customer Success', location: 'Remote', type: 'Full-time' },
  { title: 'Technical Writer', dept: 'Content', location: 'Remote', type: 'Contract' },
];

export function CareersPage() {
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
              CAREERS
            </div>
            <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Join the team</h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
              We're a small, focused team building software that helps millions of people work better.
              If that excites you, we'd love to meet you.
            </p>
          </motion.div>

          {/* Perks */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {PERKS.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="p-5 rounded-2xl text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(99,102,241,0.15)' }}
                >
                  <Icon size={18} className="text-indigo-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Job listings */}
          <h2 className="text-2xl font-black text-white mb-6">Open positions</h2>
          <div className="space-y-3">
            {OPENINGS.map(({ title, dept, location, type }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                whileHover={{ x: 4 }}
                className="group flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all duration-150"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div>
                  <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors duration-150">
                    {title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{dept}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <MapPin size={10} /> {location}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>
                      {type}
                    </span>
                  </div>
                </div>
                <ArrowRight size={16} className="text-white/30 group-hover:text-indigo-400 transition-colors duration-150" />
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-12 text-center p-8 rounded-2xl"
            style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <h3 className="text-xl font-bold text-white mb-2">Don't see a fit?</h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              We're always looking for exceptional people. Send us your resume and tell us how you'd contribute.
            </p>
            <button
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Send Open Application
            </button>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
