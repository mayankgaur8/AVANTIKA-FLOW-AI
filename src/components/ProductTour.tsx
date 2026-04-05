import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTour, TOUR_STEPS } from '../context/TourContext';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 10;

function SpotlightOverlay({ rect }: { rect: SpotlightRect | null }) {
  if (!rect) {
    return (
      <div
        className="fixed inset-0 bg-black/70"
        style={{ zIndex: 9990, backdropFilter: 'blur(1px)' }}
      />
    );
  }

  const { top, left, width, height } = rect;

  return (
    <>
      {/* Top strip */}
      <div
        className="fixed left-0 right-0"
        style={{
          top: 0,
          height: Math.max(0, top - PADDING),
          background: 'rgba(0,0,0,0.75)',
          zIndex: 9990,
        }}
      />
      {/* Bottom strip */}
      <div
        className="fixed left-0 right-0 bottom-0"
        style={{
          top: top + height + PADDING,
          background: 'rgba(0,0,0,0.75)',
          zIndex: 9990,
        }}
      />
      {/* Left strip */}
      <div
        className="fixed"
        style={{
          top: top - PADDING,
          left: 0,
          width: Math.max(0, left - PADDING),
          height: height + PADDING * 2,
          background: 'rgba(0,0,0,0.75)',
          zIndex: 9990,
        }}
      />
      {/* Right strip */}
      <div
        className="fixed right-0"
        style={{
          top: top - PADDING,
          left: left + width + PADDING,
          height: height + PADDING * 2,
          background: 'rgba(0,0,0,0.75)',
          zIndex: 9990,
        }}
      />
      {/* Highlight border */}
      <motion.div
        className="fixed pointer-events-none"
        animate={{
          top: top - PADDING,
          left: left - PADDING,
          width: width + PADDING * 2,
          height: height + PADDING * 2,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          border: '2px solid rgba(99,102,241,0.9)',
          borderRadius: '16px',
          boxShadow: '0 0 0 4px rgba(99,102,241,0.15), 0 0 40px rgba(99,102,241,0.3)',
          zIndex: 9991,
        }}
      />
    </>
  );
}

export function ProductTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isActive, currentStepIndex, totalSteps, currentStep, nextStep, prevStep, skipTour } = useTour();
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);

  const measureTarget = useCallback(() => {
    const el = document.getElementById(currentStep.targetId);
    if (!el) {
      setSpotlightRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setSpotlightRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
  }, [currentStep.targetId]);

  // Navigate to home and scroll to target element when step changes
  useEffect(() => {
    if (!isActive) return;

    const activate = async () => {
      if (location.pathname !== '/') {
        navigate('/');
        await new Promise(r => setTimeout(r, 400));
      }
      const el = document.getElementById(currentStep.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await new Promise(r => setTimeout(r, 700));
        measureTarget();
      } else {
        setSpotlightRect(null);
      }
    };

    activate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, currentStepIndex]);

  // Re-measure on window resize
  useEffect(() => {
    if (!isActive) return;
    const handler = () => measureTarget();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isActive, measureTarget]);

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;

  return (
    <AnimatePresence>
      {isActive && (
        <>
          <SpotlightOverlay rect={spotlightRect} />

          {/* Tour card */}
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed left-1/2 bottom-8 -translate-x-1/2 w-full max-w-md px-4"
            style={{ zIndex: 9995 }}
          >
            <div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: 'rgba(5,12,24,0.97)',
                border: '1px solid rgba(99,102,241,0.35)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)',
              }}
            >
              {/* Background glow */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
              />

              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                      <Sparkles size={13} className="text-white" />
                    </div>
                    <span className="text-xs font-semibold text-indigo-400">
                      Step {currentStepIndex + 1} of {totalSteps}
                    </span>
                  </div>
                  <button
                    onClick={skipTour}
                    className="text-white/30 hover:text-white/70 transition-colors duration-150"
                    aria-label="Skip tour"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                    initial={false}
                    animate={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>

                {/* Content */}
                <h3 className="text-white font-bold text-base mb-2">{currentStep.title}</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {currentStep.description}
                </p>

                {/* Buttons */}
                <div className="flex items-center gap-2">
                  {!isFirst && (
                    <motion.button
                      onClick={prevStep}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white/90 transition-colors duration-150"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <ArrowLeft size={14} /> Back
                    </motion.button>
                  )}

                  <motion.button
                    onClick={nextStep}
                    whileHover={{ scale: 1.04, boxShadow: '0 4px 20px rgba(99,102,241,0.5)' }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex-1 justify-center"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 12px rgba(99,102,241,0.35)' }}
                  >
                    {isLast ? 'Finish Tour' : 'Next'}
                    {!isLast && <ArrowRight size={14} />}
                  </motion.button>

                  <button
                    onClick={skipTour}
                    className="px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                  >
                    Skip
                  </button>
                </div>

                {/* Dot indicators */}
                <div className="flex items-center justify-center gap-1.5 mt-4">
                  {TOUR_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === currentStepIndex ? '20px' : '6px',
                        height: '6px',
                        background: i === currentStepIndex
                          ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                          : 'rgba(255,255,255,0.2)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
