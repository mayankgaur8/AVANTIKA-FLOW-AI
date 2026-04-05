import { motion } from 'framer-motion';

export const BackgroundDecor = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Base dark gradient */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #050c18 0%, #080f22 35%, #0d0825 65%, #120520 100%)' }}
      />

      {/* Blue blob — top left */}
      <motion.div
        className="absolute rounded-full"
        style={{
          top: '-20%',
          left: '-15%',
          width: '65%',
          height: '65%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, rgba(37,99,235,0.08) 45%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7], x: [0, 25, 0], y: [0, -18, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Purple blob — top right */}
      <motion.div
        className="absolute rounded-full"
        style={{
          top: '0%',
          right: '-20%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(109,40,217,0.07) 45%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.5, 0.9, 0.5], x: [0, -22, 0], y: [0, 25, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Pink blob — bottom center */}
      <motion.div
        className="absolute rounded-full"
        style={{
          bottom: '-20%',
          left: '15%',
          width: '55%',
          height: '55%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.14) 0%, rgba(219,39,119,0.05) 45%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.75, 0.4], x: [0, 18, 0], y: [0, -12, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Concentric ring overlay — centered */}
      <svg
        className="absolute opacity-[0.055]"
        style={{ top: '-8%', left: '50%', transform: 'translateX(-50%)', width: '1100px', height: '1100px', minWidth: '600px' }}
        viewBox="0 0 1100 1100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {[110, 200, 295, 390, 485, 560, 620].map((r, i) => (
          <circle
            key={i}
            cx="550"
            cy="550"
            r={r}
            stroke="white"
            strokeWidth={i > 4 ? '0.6' : '1'}
          />
        ))}
        {/* Cross-hair lines */}
        <line x1="550" y1="0" x2="550" y2="1100" stroke="white" strokeWidth="0.5" opacity="0.4" />
        <line x1="0" y1="550" x2="1100" y2="550" stroke="white" strokeWidth="0.5" opacity="0.4" />
        {/* Diagonal lines */}
        <line x1="160" y1="160" x2="940" y2="940" stroke="white" strokeWidth="0.4" opacity="0.25" />
        <line x1="940" y1="160" x2="160" y2="940" stroke="white" strokeWidth="0.4" opacity="0.25" />
      </svg>

      {/* Subtle dot-grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Bottom fade to black */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(5,12,24,0.8))' }}
      />
    </div>
  );
};
