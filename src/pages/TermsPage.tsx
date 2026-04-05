import { motion } from 'framer-motion';
import { PageLayout } from '../components/PageLayout';

const SECTIONS = [
  { title: '1. Acceptance of Terms', content: 'By accessing or using Avantika Flow AI ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service. These terms apply to all users, including visitors, registered users, and customers with paid plans.' },
  { title: '2. Description of Service', content: 'Avantika Flow AI is a workflow documentation and automation platform that allows teams to capture, optimize, and manage business processes. We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.' },
  { title: '3. User Accounts', content: 'You must create an account to use most features of our Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use. You must be at least 18 years old to create an account.' },
  { title: '4. Acceptable Use', content: 'You agree not to: (a) violate any laws or regulations; (b) infringe on intellectual property rights; (c) transmit harmful code or malware; (d) attempt to gain unauthorized access to our systems; (e) use the Service to compete with us; (f) scrape or harvest data without permission; (g) impersonate any person or entity.' },
  { title: '5. Intellectual Property', content: 'The Service and its original content, features, and functionality are owned by Avantika Flow AI, Inc. and are protected by international copyright, trademark, and other intellectual property laws. You retain ownership of content you create using the Service. By using our Service, you grant us a limited license to host and display your content.' },
  { title: '6. Payment and Billing', content: 'Paid plans are billed in advance on a monthly or annual basis. Fees are non-refundable except as required by law. We reserve the right to change our pricing with 30 days notice. Failure to pay may result in suspension of your account. You are responsible for all taxes applicable to your use of the Service.' },
  { title: '7. Termination', content: 'We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. You may terminate your account at any time by contacting support. Upon termination, your right to use the Service will cease immediately.' },
  { title: '8. Limitation of Liability', content: 'To the maximum extent permitted by law, Avantika Flow AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses. Our total liability shall not exceed the amounts you paid in the past 12 months.' },
  { title: '9. Governing Law', content: 'These Terms shall be governed by the laws of the State of California without regard to conflict of law provisions. Any disputes shall be resolved through binding arbitration in San Francisco, California, except that either party may seek injunctive relief in court for intellectual property infringement.' },
];

export function TermsPage() {
  return (
    <PageLayout>
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
            <h1 className="text-4xl font-black text-white mb-3">Terms of Service</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Last updated: March 28, 2025</p>
          </motion.div>

          <div className="space-y-8">
            {SECTIONS.map(({ title, content }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="p-6 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <h2 className="text-base font-bold text-white mb-2">{title}</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{content}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 p-5 rounded-2xl text-center"
            style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Questions about our terms? Email us at{' '}
              <a href="mailto:legal@avantikaflow.ai" className="text-indigo-400 hover:text-indigo-300">legal@avantikaflow.ai</a>
            </p>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
