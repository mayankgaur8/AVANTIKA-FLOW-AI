import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const COLORS = {
  success: { border: 'rgba(16,185,129,0.4)', icon: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  error:   { border: 'rgba(239,68,68,0.4)',  icon: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  info:    { border: 'rgba(59,130,246,0.4)', icon: '#60a5fa', bg: 'rgba(59,130,246,0.08)' },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const Icon = ICONS[toast.type];
  const colors = COLORS[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="flex items-start gap-3 px-4 py-3.5 rounded-2xl min-w-[300px] max-w-[400px] relative"
      style={{
        background: 'rgba(5,12,24,0.96)',
        border: `1px solid ${colors.border}`,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: colors.bg }}
      >
        <Icon size={16} style={{ color: colors.icon }} />
      </div>
      <p className="text-sm text-white/90 leading-snug flex-1 pt-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-white/30 hover:text-white/70 transition-colors duration-150 mt-1"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${++counter.current}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-6 right-6 flex flex-col gap-2.5 pointer-events-none"
        style={{ zIndex: 99999 }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
