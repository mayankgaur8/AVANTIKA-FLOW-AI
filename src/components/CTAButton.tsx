import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import React from 'react';

interface CTAButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showArrow?: boolean;
  onClick?: () => void;
  className?: string;
  href?: string;
}

export const CTAButton: React.FC<CTAButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  showArrow = false,
  onClick,
  className = '',
  href,
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  const variantStyles = {
    primary: {
      className: 'text-white font-semibold',
      style: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
        boxShadow: '0 0 30px rgba(139, 92, 246, 0.35), 0 4px 15px rgba(0,0,0,0.3)',
      },
      hoverStyle: {
        boxShadow: '0 0 50px rgba(139, 92, 246, 0.55), 0 8px 25px rgba(0,0,0,0.4)',
      },
    },
    secondary: {
      className: 'text-white font-medium',
      style: {
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.18)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      },
      hoverStyle: {
        background: 'rgba(255,255,255,0.14)',
        boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
      },
    },
    ghost: {
      className: 'text-white/80 font-medium hover:text-white',
      style: { background: 'transparent' },
      hoverStyle: { background: 'rgba(255,255,255,0.06)' },
    },
  };

  const currentVariant = variantStyles[variant];

  const Component = href ? 'a' : 'button';
  const extraProps = href ? { href } : { onClick };

  return (
    <motion.div
      className="inline-block"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Component
        {...(extraProps as React.AnchorHTMLAttributes<HTMLAnchorElement> & React.ButtonHTMLAttributes<HTMLButtonElement>)}
        className={`
          inline-flex items-center gap-2 rounded-full
          ${sizeClasses[size]}
          ${currentVariant.className}
          transition-all duration-200 cursor-pointer select-none
          focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
          ${className}
        `}
        style={currentVariant.style}
        onMouseEnter={(e) => {
          Object.assign((e.currentTarget as HTMLElement).style, currentVariant.hoverStyle);
        }}
        onMouseLeave={(e) => {
          Object.assign((e.currentTarget as HTMLElement).style, currentVariant.style);
        }}
      >
        {children}
        {showArrow && (
          <motion.span
            className="inline-flex"
            initial={{ x: 0 }}
            whileHover={{ x: 3 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <ArrowRight size={15} />
          </motion.span>
        )}
      </Component>
    </motion.div>
  );
};
