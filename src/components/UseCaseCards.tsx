import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, BookOpen, Code, Headphones, Sparkles } from 'lucide-react';

const USE_CASES = [
  {
    id: 'onboard-new-hires',
    label: 'Onboard new hires',
    icon: Users,
    gradient: 'from-blue-500 to-blue-600',
    glow: 'rgba(59,130,246,0.45)',
  },
  {
    id: 'create-sops',
    label: 'Create SOPs',
    icon: FileText,
    gradient: 'from-violet-500 to-purple-600',
    glow: 'rgba(139,92,246,0.45)',
  },
  {
    id: 'build-training-docs',
    label: 'Build training docs',
    icon: BookOpen,
    gradient: 'from-pink-500 to-rose-600',
    glow: 'rgba(236,72,153,0.45)',
  },
  {
    id: 'implement-software',
    label: 'Implement software',
    icon: Code,
    gradient: 'from-cyan-500 to-blue-600',
    glow: 'rgba(6,182,212,0.45)',
  },
  {
    id: 'assist-customers',
    label: 'Assist customers',
    icon: Headphones,
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'rgba(16,185,129,0.45)',
  },
  {
    id: 'something-else',
    label: 'Something else',
    icon: Sparkles,
    gradient: 'from-amber-500 to-orange-600',
    glow: 'rgba(245,158,11,0.45)',
  },
];

const cardContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

interface UseCaseCardsProps {
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  recommendedId?: string | null;
}

export const UseCaseCards: React.FC<UseCaseCardsProps> = ({ onSelect, selectedId, recommendedId }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <motion.div
      variants={cardContainerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full"
      role="group"
      aria-label="Select a use case"
    >
      {USE_CASES.map(({ id, label, icon: Icon, gradient, glow }) => {
        const isSelected = selectedId === id;
        const isHovered = hoveredId === id;
        const isRecommended = recommendedId === id;

        return (
          <motion.button
            key={id}
            variants={cardVariants}
            onClick={() => onSelect?.(id)}
            onMouseEnter={() => setHoveredId(id)}
            onMouseLeave={() => setHoveredId(null)}
            whileTap={{ scale: 0.96 }}
            aria-pressed={isSelected}
            className="relative flex flex-col items-center gap-3 p-4 rounded-2xl text-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-all duration-200"
            style={{
              background: isSelected
                ? 'rgba(255,255,255,0.12)'
                : isHovered
                ? 'rgba(255,255,255,0.09)'
                : 'rgba(255,255,255,0.05)',
              border: isSelected
                ? `1px solid ${glow.replace('0.45', '0.7')}`
                : isRecommended
                ? '1px solid rgba(16,185,129,0.45)'
                : isHovered
                ? '1px solid rgba(255,255,255,0.22)'
                : '1px solid rgba(255,255,255,0.10)',
              boxShadow: isSelected
                ? `0 0 24px ${glow}, 0 8px 30px rgba(0,0,0,0.2)`
                : isRecommended
                ? '0 0 14px rgba(16,185,129,0.35), 0 6px 20px rgba(0,0,0,0.18)'
                : isHovered
                ? '0 8px 24px rgba(0,0,0,0.25)'
                : '0 2px 8px rgba(0,0,0,0.15)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Glow ring on selected */}
            {isSelected && (
              <motion.div
                layoutId="selectedRing"
                className="absolute inset-0 rounded-2xl"
                style={{ boxShadow: `inset 0 0 0 1.5px ${glow.replace('0.45', '0.6')}` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}

            {/* Icon */}
            <motion.div
              animate={isHovered || isSelected ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}
              style={{
                boxShadow: isSelected || isHovered ? `0 4px 16px ${glow}` : 'none',
              }}
            >
              <Icon size={18} className="text-white" strokeWidth={2} />
            </motion.div>

            {/* Label */}
            <span
              className="text-xs font-semibold leading-snug"
              style={{
                color: isSelected ? 'white' : isHovered ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.72)',
              }}
            >
              {label}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
};
