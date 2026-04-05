import { motion } from 'framer-motion';
import { PageLayout } from '../components/PageLayout';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This includes:

• **Account information**: name, email address, password
• **Profile information**: company name, job title, team size
• **Usage data**: workflows created, features used, session data
• **Device information**: browser type, IP address, operating system

We also collect information automatically through cookies and similar technologies when you use our services.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Process transactions and send related information
• Send technical notices, updates, security alerts, and support messages
• Respond to your comments and questions
• Monitor and analyze trends, usage, and activities
• Detect and prevent fraudulent transactions and other illegal activities
• Personalize your experience based on your preferences`,
  },
  {
    title: '3. Information Sharing',
    content: `We do not sell your personal information. We may share your information with:

• **Service providers**: vendors that perform services on our behalf (hosting, analytics, email delivery)
• **Business transfers**: in connection with a merger, acquisition, or sale of assets
• **Legal requirements**: when required by law or to protect rights and safety
• **With your consent**: for any other purpose with your explicit consent

We require all third parties to respect the security of your data and treat it in accordance with applicable laws.`,
  },
  {
    title: '4. Data Retention',
    content: `We retain your personal information for as long as necessary to provide you with our services and as required by applicable laws. When you delete your account, we will delete your personal information within 30 days, except where we are required to retain it for legal obligations.`,
  },
  {
    title: '5. Security',
    content: `We implement industry-standard security measures including:

• End-to-end encryption for data in transit (TLS 1.3)
• AES-256 encryption for data at rest
• SOC 2 Type II certification
• Regular third-party security audits
• Role-based access controls

No method of electronic transmission is 100% secure. We cannot guarantee absolute security but are committed to protecting your information.`,
  },
  {
    title: '6. Your Rights',
    content: `Depending on your location, you may have the right to:

• Access the personal information we hold about you
• Correct inaccurate personal information
• Request deletion of your personal information
• Object to processing of your personal information
• Data portability — receive your data in a structured format
• Withdraw consent at any time

To exercise these rights, contact us at privacy@avantikaflow.ai.`,
  },
  {
    title: '7. Contact Us',
    content: `If you have questions about this Privacy Policy, please contact:

**Avantika Flow AI, Inc.**
Email: privacy@avantikaflow.ai
Address: 123 Market Street, San Francisco, CA 94105

We will respond to your inquiry within 30 days.`,
  },
];

export function PrivacyPolicyPage() {
  return (
    <PageLayout>
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
            <h1 className="text-4xl font-black text-white mb-3">Privacy Policy</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Last updated: March 28, 2025</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="p-5 rounded-2xl mb-10"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              This Privacy Policy explains how Avantika Flow AI, Inc. ("we", "us", or "our") collects, uses, and shares information about you when you use our services. We are committed to protecting your privacy and being transparent about our data practices.
            </p>
          </motion.div>

          <div className="space-y-8">
            {SECTIONS.map(({ title, content }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
              >
                <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
                <div className="text-sm leading-loose whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {content.split('\n').map((line, j) => (
                    <p key={j} className={line.startsWith('•') || line.startsWith('**') ? 'ml-2' : ''}>
                      {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
