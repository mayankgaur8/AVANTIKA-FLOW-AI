import { motion } from 'framer-motion';

const LOGOS = [
  { name: 'Stripe',     text: 'Stripe' },
  { name: 'Shopify',   text: 'Shopify' },
  { name: 'Notion',    text: 'Notion' },
  { name: 'Figma',     text: 'Figma' },
  { name: 'Atlassian', text: 'Atlassian' },
  { name: 'Salesforce',text: 'Salesforce' },
  { name: 'HubSpot',   text: 'HubSpot' },
  { name: 'Zendesk',   text: 'Zendesk' },
];

export const LogoStrip = () => {
  return (
    <section className="relative py-16 px-5 md:px-8" style={{ zIndex: 1 }}>
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-sm font-medium mb-10 tracking-wide uppercase"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Trusted by 10,000+ teams at companies like
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap justify-center items-center gap-x-10 gap-y-6"
        >
          {LOGOS.map(({ name, text }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="px-5 py-2.5 rounded-xl select-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span
                className="text-sm font-bold tracking-tight"
                style={{ color: 'rgba(255,255,255,0.38)' }}
              >
                {text}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
