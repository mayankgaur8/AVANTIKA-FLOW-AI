import { motion } from 'framer-motion';
import { Twitter, Linkedin, Github, Mail } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

const FOOTER_LINKS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Capture', to: '/product/capture' },
      { label: 'Optimize', to: '/product/optimize' },
      { label: 'Workflow AI', to: '/product/workflow-ai' },
      { label: 'Integrations', to: '/product/integrations' },
      { label: 'Pricing', to: '/pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Careers', to: '/careers' },
      { label: 'Press', to: '/press' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', to: '/docs' },
      { label: 'Template Gallery', to: '/templates' },
      { label: 'Community', to: '/community' },
      { label: 'Changelog', to: '/changelog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Cookie Policy', to: '/cookie-policy' },
      { label: 'GDPR', to: '/gdpr' },
    ],
  },
];

const BOTTOM_LINKS = [
  { label: 'Privacy', to: '/privacy-policy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Cookies', to: '/cookie-policy' },
];

const SOCIAL = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
  { icon: Mail, label: 'Email', href: 'mailto:hello@avantikaflow.ai' },
];

export const Footer = () => {
  const year = new Date().getFullYear();
  const location = useLocation();

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <footer
      className="relative pt-20 pb-10 px-5 md:px-8"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        zIndex: 1,
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-14">
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="col-span-2 md:col-span-1"
          >
            <BrandLogo
              className="mb-4 w-fit"
              imageClassName="h-10 w-10 object-cover object-top rounded-xl ring-1 ring-white/20 shadow-[0_0_18px_rgba(96,165,250,0.28)]"
              wordmarkClassName="text-white font-bold text-base tracking-tight"
            />
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)' }}>
              Capture and optimize workflows so your teams and AI agents do their best work.
            </p>
            <div className="flex gap-2.5">
              {SOCIAL.map(({ icon: Icon, label, href }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                  whileHover={{ scale: 1.1, color: 'white', background: 'rgba(255,255,255,0.13)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={15} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          {FOOTER_LINKS.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
            >
              <h4 className="text-white font-semibold text-sm mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-sm transition-colors duration-150 hover:text-white"
                      style={{ color: isActive(to) ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.42)' }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            © {year} Avantika Flow AI, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {BOTTOM_LINKS.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="text-xs transition-colors duration-150 hover:text-white"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
