import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

interface RequestDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePage?: string;
}

const USE_CASES = [
  'Document processes & SOPs',
  'Onboard new hires',
  'Train teammates',
  'Automate workflows',
  'Customer support',
  'Other',
];

export function RequestDemoModal({ isOpen, onClose, sourcePage }: RequestDemoModalProps) {
  const { addToast } = useToast();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    company: '',
    use_case: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setLoading(false);
      setForm({ full_name: '', email: '', company: '', use_case: '', message: '' });
      setErrors({});
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (!form.full_name.trim()) errs.full_name = 'Name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await api.demoRequest({
        full_name: form.full_name,
        email: form.email,
        company: form.company,
        message: `Use case: ${form.use_case || 'Not specified'}\n\n${form.message}`,
        source_page: sourcePage || '/',
      });
      setStep('success');
      addToast('Demo request submitted! Our team will reach out shortly.', 'success');
    } catch {
      addToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const field = (
    name: keyof typeof form,
    label: string,
    placeholder: string,
    type = 'text',
    required = false
  ) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
        {label}{required && <span className="text-indigo-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[name]}
        onChange={e => {
          setForm(prev => ({ ...prev, [name]: e.target.value }));
          if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        }}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all duration-150"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: errors[name] ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.1)',
        }}
        onFocus={e => (e.currentTarget.style.border = '1px solid rgba(99,102,241,0.6)')}
        onBlur={e => (e.currentTarget.style.border = errors[name] ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.1)')}
      />
      {errors[name] && <p className="mt-1 text-xs text-red-400">{errors[name]}</p>}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 9000 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg px-4"
            style={{ zIndex: 9001 }}
          >
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{
                background: 'rgba(5,12,24,0.98)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              }}
            >
              {/* Top gradient strip */}
              <div
                className="h-1 w-full"
                style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)' }}
              />

              {step === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                    style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}
                  >
                    <CheckCircle2 size={32} className="text-emerald-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-3">Request Received!</h3>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Our team will contact you shortly to schedule your personalized demo.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                  >
                    Close
                  </button>
                </motion.div>
              ) : (
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white">Request a Demo</h2>
                      <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        Get a personalized walkthrough with our team
                      </p>
                    </div>
                    <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors mt-0.5">
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {field('full_name', 'Your Name', 'Jane Smith', 'text', true)}
                      {field('email', 'Work Email', 'jane@company.com', 'email', true)}
                    </div>
                    {field('company', 'Company', 'Acme Corp')}

                    {/* Use case selector */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        Primary Use Case
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {USE_CASES.map(uc => (
                          <button
                            key={uc}
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, use_case: uc }))}
                            className="px-3 py-2 rounded-xl text-xs font-medium text-left transition-all duration-150"
                            style={{
                              background: form.use_case === uc ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                              border: form.use_case === uc ? '1px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.08)',
                              color: form.use_case === uc ? '#a5b4fc' : 'rgba(255,255,255,0.55)',
                            }}
                          >
                            {uc}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        Message (optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tell us about your team's workflow challenges..."
                        value={form.message}
                        onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none resize-none transition-all duration-150"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                        onFocus={e => (e.currentTarget.style.border = '1px solid rgba(99,102,241,0.6)')}
                        onBlur={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)')}
                      />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={!loading ? { scale: 1.02, boxShadow: '0 4px 20px rgba(99,102,241,0.5)' } : {}}
                      whileTap={!loading ? { scale: 0.98 } : {}}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity duration-150"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        opacity: loading ? 0.75 : 1,
                      }}
                    >
                      {loading ? (
                        <><Loader2 size={15} className="animate-spin" /> Submitting...</>
                      ) : (
                        <>Request Demo <ArrowRight size={15} /></>
                      )}
                    </motion.button>

                    <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      No spam. Our team will respond within 1 business day.
                    </p>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
