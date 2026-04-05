import { motion } from 'framer-motion';
import { Users, MessageSquare, Star, ArrowRight, Github, Twitter } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';

const CHANNELS = [
  { icon: MessageSquare, name: '#general', desc: 'Community chat and announcements', members: '8.2k' },
  { icon: Star, name: '#showcase', desc: 'Share your workflow templates', members: '4.1k' },
  { icon: Users, name: '#help', desc: 'Get help from the community', members: '6.3k' },
  { icon: Github, name: '#dev', desc: 'API, integrations, and developer talk', members: '2.8k' },
];

export function CommunityPage() {
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
              COMMUNITY
            </div>
            <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Join the community</h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Connect with 50,000+ ops leaders, product managers, and workflow enthusiasts building better processes together.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-5 mb-14">
            {[
              { value: '50k+', label: 'Community members' },
              { value: '1,200+', label: 'Templates shared' },
              { value: '24/7', label: 'Active discussions' },
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
          </div>

          {/* Slack channels */}
          <h2 className="text-2xl font-black text-white mb-6">Slack Community Channels</h2>
          <div className="space-y-3 mb-12">
            {CHANNELS.map(({ icon: Icon, name, desc, members }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.45 }}
                whileHover={{ x: 4 }}
                className="group flex items-center justify-between p-5 rounded-2xl cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.15)' }}
                  >
                    <Icon size={17} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors duration-150">{name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc} · {members} members</p>
                  </div>
                </div>
                <ArrowRight size={15} className="text-white/20 group-hover:text-indigo-400 transition-colors duration-150" />
              </motion.div>
            ))}
          </div>

          {/* Join CTAs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-7 rounded-2xl text-center"
              style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
            >
              <MessageSquare size={28} className="text-indigo-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Join Slack</h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Real-time chat with workflow experts and power users.</p>
              <button className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                Join Slack Community
              </button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-7 rounded-2xl text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <Twitter size={28} className="text-sky-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Follow on Twitter</h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Workflow tips, product updates, and community highlights.</p>
              <button className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                @AvantikaFlowAI
              </button>
            </motion.div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
