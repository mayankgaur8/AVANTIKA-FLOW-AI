import { motion } from 'framer-motion';
import { Star, Users } from 'lucide-react';

export const TrustBadge = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="inline-flex items-center gap-3 px-4 py-2 rounded-full"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'].map((color, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full border-2 border-[#050c18] flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, zIndex: 4 - i }}
          >
            <Users size={10} className="text-white" />
          </div>
        ))}
      </div>

      <div className="w-px h-4 bg-white/20" />

      {/* Stars */}
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
        ))}
      </div>

      <span className="text-white/70 text-xs font-medium">
        Trusted by <span className="text-white font-semibold">5M+</span> users across{' '}
        <span className="text-white font-semibold">10,000+</span> teams
      </span>
    </motion.div>
  );
};
