import { motion } from 'framer-motion';
import { PageLayout } from '../components/PageLayout';

const COOKIE_TYPES = [
  {
    name: 'Strictly Necessary',
    badge: 'Always Active',
    badgeColor: '#10b981',
    desc: 'These cookies are essential for the website to function and cannot be switched off. They are usually set in response to actions made by you, such as logging in or filling out forms.',
    examples: ['Session authentication', 'CSRF protection tokens', 'Load balancing'],
  },
  {
    name: 'Analytics',
    badge: 'Optional',
    badgeColor: '#f59e0b',
    desc: 'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular.',
    examples: ['Page view tracking', 'Session duration', 'Error monitoring'],
  },
  {
    name: 'Functional',
    badge: 'Optional',
    badgeColor: '#6366f1',
    desc: 'These cookies enable enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.',
    examples: ['Language preferences', 'Theme settings', 'Tour completion state'],
  },
  {
    name: 'Marketing',
    badge: 'Optional',
    badgeColor: '#ec4899',
    desc: 'These cookies may be set through our site by our advertising partners. They may be used to build a profile of your interests and show you relevant ads on other sites.',
    examples: ['Ad targeting', 'Conversion tracking', 'Retargeting pixels'],
  },
];

export function CookiePolicyPage() {
  return (
    <PageLayout>
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
            <h1 className="text-4xl font-black text-white mb-3">Cookie Policy</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Last updated: March 28, 2025</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl mb-10 text-sm leading-relaxed"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'rgba(255,255,255,0.65)' }}
          >
            This Cookie Policy explains how Avantika Flow AI uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them.
          </motion.div>

          <div className="space-y-5">
            {COOKIE_TYPES.map(({ name, badge, badgeColor, desc, examples }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="p-6 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-base font-bold text-white">{name} Cookies</h2>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${badgeColor}18`, color: badgeColor, border: `1px solid ${badgeColor}40` }}
                  >
                    {badge}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>{desc}</p>
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {examples.map(ex => (
                      <span key={ex} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 p-6 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <h3 className="text-base font-bold text-white mb-2">Managing Cookies</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              You can manage cookie preferences through your browser settings or our cookie consent manager. Note that disabling certain cookies may affect the functionality of our service. To opt out of analytics cookies, you can also visit your account settings.
            </p>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
