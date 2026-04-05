import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../BrandLogo';

interface OnboardingLayoutProps {
  /** 1-based current step */
  step: number;
  totalSteps: number;
  children: ReactNode;
}

export const OnboardingLayout = ({ step, totalSteps, children }: OnboardingLayoutProps) => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)',
      }}
    >
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[480px] bg-white rounded-3xl shadow-xl overflow-hidden"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.06)' }}
      >
        {/* Gradient top accent */}
        <div
          className="h-1 w-full"
          style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)' }}
        />

        <div className="px-8 pt-7 pb-8">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <BrandLogo
              imageClassName="h-10 w-10 object-cover object-top rounded-xl ring-1 ring-gray-200 shadow-[0_0_14px_rgba(59,130,246,0.25)]"
              wordmarkClassName="font-bold text-gray-900 text-base tracking-tight"
            />

            {/* Step counter */}
            <span className="text-xs font-semibold text-gray-400">
              Step {step} of {totalSteps}
            </span>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <motion.div
                key={i}
                className="h-1.5 rounded-full flex-1 overflow-hidden bg-gray-100"
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: i < step ? '100%' : '0%' }}
                  transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.08 }}
                  style={{
                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Page content */}
          {children}
        </div>
      </motion.div>

      {/* Footer note */}
      <p className="mt-6 text-xs text-gray-400 text-center">
        Need help?{' '}
        <Link to="/contact" className="text-violet-600 hover:underline font-medium">
          Contact support
        </Link>
      </p>
    </div>
  );
};
