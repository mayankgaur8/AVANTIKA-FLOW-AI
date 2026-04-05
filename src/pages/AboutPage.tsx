import { motion } from 'framer-motion';
import { Users, Target, Globe, Sparkles } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';

const VALUES = [
  { icon: Target, title: 'Customer Obsession', desc: 'Every feature we build starts with a real customer problem. We ship what matters.' },
  { icon: Sparkles, title: 'AI-First Thinking', desc: 'We don\'t add AI as a feature — we design workflows around what AI can fundamentally change.' },
  { icon: Users, title: 'Team Transparency', desc: 'Open roadmap, public changelog, honest communication. We build trust by being clear.' },
  { icon: Globe, title: 'Global Impact', desc: 'Great processes should be accessible to teams everywhere — from startups to enterprises worldwide.' },
];

const TEAM = [
  { name: 'Avantika Sharma', role: 'CEO & Co-founder', avatar: 'AS', gradient: 'from-blue-500 to-indigo-600' },
  { name: 'Rohan Mehta', role: 'CTO & Co-founder', avatar: 'RM', gradient: 'from-purple-500 to-pink-500' },
  { name: 'Priya Nair', role: 'Head of Product', avatar: 'PN', gradient: 'from-emerald-500 to-teal-500' },
  { name: 'James Liu', role: 'Head of Engineering', avatar: 'JL', gradient: 'from-amber-500 to-orange-500' },
  { name: 'Sofia Torres', role: 'Head of Design', avatar: 'ST', gradient: 'from-rose-500 to-pink-500' },
  { name: 'Alex Kim', role: 'Head of Sales', avatar: 'AK', gradient: 'from-cyan-500 to-blue-500' },
];

export function AboutPage() {
  return (
    <PageLayout>
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-20 max-w-3xl mx-auto"
          >
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}
            >
              ABOUT US
            </div>
            <h1 className="text-5xl font-black text-white mb-5 tracking-tight">
              We're building the operating system for how teams work
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Avantika Flow AI was founded in 2023 with a simple belief: great teams deserve great processes.
              We combine AI with workflow intelligence to help organizations capture, standardize, and continuously improve how they work.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-20"
          >
            {[
              { value: '2023', label: 'Founded' },
              { value: '5M+', label: 'Users worldwide' },
              { value: '10k+', label: 'Teams onboarded' },
              { value: '42', label: 'Team members' },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="text-center p-6 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="text-3xl font-black mb-1 bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(90deg, #60a5fa, #a78bfa)' }}
                >
                  {value}
                </div>
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</div>
              </div>
            ))}
          </motion.div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-10 md:p-14 mb-20 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            <h2 className="text-4xl font-black text-white mb-4">Our Mission</h2>
            <p className="text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              "To make every team's institutional knowledge visible, shareable, and continuously improving — powered by AI."
            </p>
          </motion.div>

          {/* Values */}
          <div className="mb-20">
            <h2 className="text-3xl font-black text-white text-center mb-10">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {VALUES.map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="flex items-start gap-4 p-6 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.15)' }}
                  >
                    <Icon size={18} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">{title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div>
            <h2 className="text-3xl font-black text-white text-center mb-10">Leadership Team</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {TEAM.map(({ name, role, avatar, gradient }, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                  className="text-center p-6 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-3`}
                  >
                    <span className="text-white font-black text-sm">{avatar}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
