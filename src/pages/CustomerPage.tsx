import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, MessageSquare, PlayCircle, Zap,
  ArrowRight, Play, Star, TrendingUp, HeartHandshake, Sparkles,
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { useProductCTA } from '../hooks/useProductCTA';

const USE_CASES = [
  {
    icon: UserCheck,
    title: 'Customer Onboarding Flows',
    description: 'Turn first-time users into power users systematically. Every customer gets the same great guided experience.',
    color: '#f59e0b',
    to: '/customer/onboarding-flows',
    cta: 'Launch Onboarding Builder',
  },
  {
    icon: MessageSquare,
    title: 'Support Response Playbooks',
    description: 'Resolve tickets faster with guided, consistent answers. New agents perform like veterans from day one.',
    color: '#3b82f6',
    to: '/customer/support-playbooks',
    cta: 'Launch Support Builder',
  },
  {
    icon: PlayCircle,
    title: 'Demo Walkthrough Guides',
    description: 'Empower every rep to run a flawless product demo. Record once, replicate the perfect demo forever.',
    color: '#8b5cf6',
    to: '/customer/demo-guides',
    cta: 'Launch Demo Builder',
  },
  {
    icon: Zap,
    title: 'Sales Enablement Workflows',
    description: 'Get new reps to quota faster with proven playbooks. Document what top performers do and scale it.',
    color: '#ec4899',
    to: '/customer/sales-workflows',
    cta: 'Launch Sales Builder',
  },
];

const STATS = [
  { value: '40%', label: 'Faster customer onboarding' },
  { value: '3×', label: 'Faster rep ramp time' },
  { value: '92%', label: 'CSAT consistency score' },
  { value: '1 day', label: 'Average playbook creation time' },
];

const TESTIMONIAL = {
  quote: "We went from spending 3 weeks onboarding each enterprise customer to 4 days. The guided workflows are a game changer.",
  name: 'Sarah Chen',
  title: 'VP of Customer Success',
  company: 'Acme Corp',
};

export const CustomerPage = () => {
  const { handleCTA } = useProductCTA();
  return (
    <div className="min-h-screen" style={{ background: '#050c18' }}>
      <Navigation />

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}
            >
              <Users size={12} /> FOR CUSTOMER-FACING TEAMS
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
              Every customer interaction,
              <span style={{ color: '#f59e0b' }}> consistently excellent.</span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              From first demo to full adoption, give every customer the same high-quality guided experience — regardless of which rep they talk to.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.button
                onClick={() => handleCTA('customer-onboarding', { sourcePage: '/solutions/customer', ctaClicked: 'customer_hero_start' })}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)', boxShadow: '0 4px 20px rgba(245,158,11,0.35)' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Start Recording Playbooks <ArrowRight size={16} />
              </motion.button>
              <motion.button
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-white/80 font-medium"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                whileHover={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <Play size={14} /> See a Demo
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-xs text-white/50 leading-snug">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3">Built for every customer touchpoint</h2>
            <p className="text-white/50">Record the best way to do it. Deploy it to every rep, every time.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {USE_CASES.map((uc, i) => {
              const Icon = uc.icon;
              return (
                <motion.div
                  key={uc.title}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl"
                >
                  <Link
                    to={uc.to}
                    className="block rounded-2xl p-7 group no-underline transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'inherit', textDecoration: 'none' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${uc.color}40`;
                      (e.currentTarget as HTMLElement).style.background = `${uc.color}08`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                      style={{ background: `${uc.color}18` }}
                    >
                      <Icon size={20} strokeWidth={1.8} style={{ color: uc.color }} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{uc.title}</h3>
                    <p className="text-white/55 text-sm leading-relaxed mb-4">{uc.description}</p>
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: uc.color }}>
                      {uc.cta} <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Testimonial */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-10 text-center"
            style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" style={{ color: '#f59e0b' }} />)}
            </div>
            <blockquote className="text-xl text-white/80 font-medium leading-relaxed mb-6 italic">
              "{TESTIMONIAL.quote}"
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-pink-500" />
              <div className="text-left">
                <div className="text-sm font-bold text-white">{TESTIMONIAL.name}</div>
                <div className="text-xs text-white/40">{TESTIMONIAL.title} · {TESTIMONIAL.company}</div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* AI Templates */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div
            className="rounded-3xl p-10"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(236,72,153,0.1))', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={16} style={{ color: '#f59e0b' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#f59e0b' }}>AI-Powered Templates</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Start with proven playbooks</h2>
            <p className="text-white/50 mb-8">AI generates your first guide from a template — edit, record, and deploy in minutes.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Build customer onboarding guide', 'Create support response playbook', 'Document product demo flow'].map((tpl) => (
                <motion.button
                  key={tpl}
                  onClick={() => handleCTA('customer-onboarding', { sourcePage: '/solutions/customer', ctaClicked: 'customer_template' })}
                  className="flex items-start gap-2.5 p-4 rounded-xl text-left text-sm text-white/70 hover:text-white transition-all duration-150"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  whileHover={{ background: 'rgba(255,255,255,0.10)', scale: 1.01 }}
                >
                  <Sparkles size={13} className="flex-shrink-0 mt-0.5 text-amber-400" />
                  {tpl}
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-14"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(139,92,246,0.12))', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex justify-center gap-4 mb-5 text-white/30">
              <HeartHandshake size={20} />
              <TrendingUp size={20} />
              <Users size={20} />
            </div>
            <h2 className="text-4xl font-black text-white mb-4">Stop hoping reps follow the right process</h2>
            <p className="text-white/50 mb-8 text-lg">Make the right way the only way — with guided, recorded workflows.</p>
            <motion.button
              onClick={() => handleCTA('customer-onboarding', { sourcePage: '/solutions/customer', ctaClicked: 'customer_bottom_cta' })}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-base"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)', boxShadow: '0 6px 28px rgba(245,158,11,0.35)' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started Free <ArrowRight size={18} />
            </motion.button>
            <p className="text-white/30 text-xs mt-4">No credit card required · Setup in 2 minutes</p>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
