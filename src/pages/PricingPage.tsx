import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Zap, Shield, Building2 } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { useOnboarding } from '../context/OnboardingContext';

const PLANS = [
  {
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'Perfect for individuals and small teams getting started.',
    icon: Zap,
    gradient: 'from-amber-500 to-orange-500',
    features: [
      'Up to 5 workflows',
      '10 captures per month',
      'Basic AI suggestions',
      'Email support',
      '1 integration',
    ],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: { monthly: 29, annual: 22 },
    description: 'For growing teams that need more power and collaboration.',
    icon: Shield,
    gradient: 'from-blue-500 to-indigo-600',
    features: [
      'Unlimited workflows',
      'Unlimited captures',
      'Advanced Workflow AI',
      'Priority support',
      '50+ integrations',
      'Team collaboration',
      'Analytics dashboard',
      'Custom templates',
    ],
    cta: 'Start Pro Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: { monthly: null, annual: null },
    description: 'Custom pricing for large organizations with complex needs.',
    icon: Building2,
    gradient: 'from-purple-500 to-pink-500',
    features: [
      'Everything in Pro',
      'SSO & SAML',
      'Advanced security controls',
      'Dedicated customer success',
      '200+ integrations',
      'Custom AI models',
      'SLA guarantee',
      'On-premise option',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const FAQ = [
  { q: 'Can I change plans anytime?', a: 'Yes. You can upgrade or downgrade your plan at any time. Changes take effect immediately and are prorated.' },
  { q: 'Is there a free trial for Pro?', a: 'Absolutely. Pro includes a 14-day free trial — no credit card required.' },
  { q: 'What happens to my data if I downgrade?', a: 'Your data is safe. If you exceed free plan limits after downgrading, older workflows become read-only.' },
  { q: 'Do you offer non-profit or education discounts?', a: 'Yes! Contact our sales team for special pricing for non-profits, startups, and educational institutions.' },
];

export function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const { openOnboarding } = useOnboarding();

  return (
    <PageLayout>
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12"
          >
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}
            >
              PRICING
            </div>
            <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
              Simple, transparent pricing
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Start free. Scale when you're ready. No hidden fees.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className="text-sm font-medium" style={{ color: annual ? 'rgba(255,255,255,0.45)' : 'white' }}>Monthly</span>
              <button
                onClick={() => setAnnual(v => !v)}
                className="w-12 h-6 rounded-full relative transition-colors duration-300"
                style={{ background: annual ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.15)' }}
              >
                <motion.div
                  animate={{ x: annual ? 24 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full"
                />
              </button>
              <span className="text-sm font-medium" style={{ color: annual ? 'white' : 'rgba(255,255,255,0.45)' }}>
                Annual{' '}
                <span className="text-emerald-400 font-semibold">Save 25%</span>
              </span>
            </div>
          </motion.div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {PLANS.map(({ name, price, description, icon: Icon, gradient, features, cta, highlight }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-2xl p-7 overflow-hidden"
                style={{
                  background: highlight ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                  border: highlight ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: highlight ? '0 0 60px rgba(99,102,241,0.15)' : 'none',
                }}
              >
                {highlight && (
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                )}
                {highlight && (
                  <div
                    className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)' }}
                  >
                    MOST POPULAR
                  </div>
                )}

                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5`}
                  style={{ boxShadow: highlight ? '0 4px 16px rgba(99,102,241,0.4)' : 'none' }}
                >
                  <Icon size={20} className="text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
                <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>{description}</p>

                <div className="mb-6">
                  {price.monthly === null ? (
                    <span className="text-3xl font-black text-white">Custom</span>
                  ) : price.monthly === 0 ? (
                    <span className="text-3xl font-black text-white">Free</span>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black text-white">
                        ${annual ? price.annual : price.monthly}
                      </span>
                      <span className="text-sm mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>/mo</span>
                    </div>
                  )}
                </div>

                <motion.button
                  onClick={() => openOnboarding({ sourcePage: '/pricing', ctaClicked: `pricing_${name.toLowerCase()}` })}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold mb-6 transition-all duration-150"
                  style={highlight ? {
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                  } : {
                    background: 'rgba(255,255,255,0.07)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {cta} <ArrowRight size={14} />
                </motion.button>

                <ul className="space-y-2.5">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-black text-white text-center mb-10">Frequently asked questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              {FAQ.map(({ q, a }) => (
                <div
                  key={q}
                  className="p-6 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <h4 className="text-sm font-semibold text-white mb-2">{q}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
