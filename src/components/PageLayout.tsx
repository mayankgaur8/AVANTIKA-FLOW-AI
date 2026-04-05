import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { BackgroundDecor } from './BackgroundDecor';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div className="relative min-h-screen" style={{ background: '#050c18' }}>
      <BackgroundDecor />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className={`relative ${className}`}
        style={{ zIndex: 1 }}
      >
        <Navigation />
        <main>{children}</main>
        <Footer />
      </motion.div>
    </div>
  );
}
