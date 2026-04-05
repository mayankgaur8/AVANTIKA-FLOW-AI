import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ProductHeroProps {
  badge?: string;
  title: string;
  subtitle: string;
  primaryCta: ReactNode;
  secondaryCta?: ReactNode;
  rightVisual?: ReactNode;
  dark?: boolean;
}

export const ProductHero = ({
  badge,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  rightVisual,
  dark = false,
}: ProductHeroProps) => {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-20">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: dark
            ? 'radial-gradient(circle at 20% 20%, rgba(139,92,246,0.2), transparent 45%), radial-gradient(circle at 80% 10%, rgba(59,130,246,0.16), transparent 45%)'
            : 'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.13), transparent 45%), radial-gradient(circle at 80% 10%, rgba(236,72,153,0.12), transparent 45%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          {badge ? (
            <span className={`inline-flex text-xs font-semibold px-3 py-1.5 rounded-full border mb-5 ${dark ? 'text-violet-200 border-violet-300/30 bg-violet-400/10' : 'text-blue-700 border-blue-200 bg-blue-50'}`}>
              {badge}
            </span>
          ) : null}

          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h1>
          <p className={`mt-4 text-lg max-w-xl ${dark ? 'text-white/65' : 'text-gray-600'}`}>{subtitle}</p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {primaryCta}
            {secondaryCta}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.55 }}
        >
          {rightVisual}
        </motion.div>
      </div>
    </section>
  );
};
