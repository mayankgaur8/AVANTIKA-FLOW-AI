import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, ArrowRight, CheckCircle2, Loader2, MapPin, Clock } from 'lucide-react';
import { PageLayout } from '../components/PageLayout';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

const TOPICS = ['General inquiry', 'Sales & pricing', 'Technical support', 'Partnership', 'Press', 'Other'];

export function ContactPage() {
  const { addToast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', topic: '', message: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.full_name.trim()) e.full_name = 'Required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.message.trim()) e.message = 'Please write a message';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await api.contact({
        full_name: form.full_name,
        email: form.email,
        subject: form.topic || 'General inquiry',
        message: form.message,
        source_page: '/contact',
      });
      setSubmitted(true);
      addToast("Message sent! We'll get back to you within 1 business day.", 'success');
    } catch {
      addToast('Failed to send message. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setErrors({}); }, [form]);

  const inputClass = (err?: string) =>
    `w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all duration-150 ${
      err ? 'border-red-400/60' : 'border-white/10 focus:border-indigo-400/60'
    }`;

  return (
    <PageLayout>
      <section className="py-24 px-5 md:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}
            >
              CONTACT
            </div>
            <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Get in touch</h1>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Questions, feedback, or partnership ideas — we're listening.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact info */}
            <div className="space-y-4">
              {[
                { icon: Mail, title: 'Email', value: 'hello@avantikaflow.ai', sub: 'General inquiries' },
                { icon: MessageSquare, title: 'Support', value: 'support@avantikaflow.ai', sub: 'Technical help' },
                { icon: MapPin, title: 'HQ', value: 'San Francisco, CA', sub: 'Remote-first team' },
                { icon: Clock, title: 'Response time', value: '< 24 hours', sub: 'Business days' },
              ].map(({ icon: Icon, title, value, sub }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.15)' }}
                  >
                    <Icon size={15} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{title}</p>
                    <p className="text-sm font-medium text-white">{value}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="md:col-span-2"
            >
              {submitted ? (
                <div
                  className="h-full flex flex-col items-center justify-center text-center p-10 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <CheckCircle2 size={40} className="text-emerald-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Message sent!</h3>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    We typically respond within 1 business day.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="p-7 rounded-2xl space-y-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Name <span className="text-indigo-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={form.full_name}
                        onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                        className={inputClass(errors.full_name)}
                        style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${errors.full_name ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'}` }}
                      />
                      {errors.full_name && <p className="mt-1 text-xs text-red-400">{errors.full_name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Email <span className="text-indigo-400">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="you@company.com"
                        value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        className={inputClass(errors.email)}
                        style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${errors.email ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'}` }}
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Topic</label>
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, topic: t }))}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                          style={{
                            background: form.topic === t ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                            border: form.topic === t ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                            color: form.topic === t ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Message <span className="text-indigo-400">*</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Tell us what's on your mind..."
                      value={form.message}
                      onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none resize-none"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${errors.message ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'}`,
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={e => !errors.message && (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)')}
                      onBlur={e => !errors.message && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                    {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.02 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      opacity: loading ? 0.75 : 1,
                    }}
                  >
                    {loading ? <><Loader2 size={15} className="animate-spin" /> Sending...</> : <>Send Message <ArrowRight size={15} /></>}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
