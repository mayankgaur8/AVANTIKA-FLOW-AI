import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { useSalesInquiry } from '../context/SalesInquiryContext';
import { api } from '../lib/api';

const INTEREST_OPTIONS = ['Capture', 'Optimize', 'Workflow AI', 'Integrations & API', 'Optimize Agents'];
const TEAM_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'];

export const TalkToSalesModal = () => {
  const { isOpen, closeSales, source, interestArea } = useSalesInquiry();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    company: '',
    team_size: '',
    role: '',
    interest_area: interestArea || '',
    message: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(
    () => form.full_name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && form.message.trim(),
    [form],
  );

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const onSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError('');

    try {
      await api.salesInquiry({
        ...form,
        source_page: source.sourcePage,
        cta_clicked: source.ctaClicked,
        campaign_source: source.campaignSource,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        closeSales();
      }, 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to submit inquiry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center px-4"
          style={{ background: 'rgba(4,10,22,0.72)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeSales(); }}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl rounded-3xl border border-white/50 bg-white shadow-2xl overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
            <div className="p-7 sm:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">Talk to sales</h3>
                  <p className="text-sm text-gray-500 mt-1">Tell us about your goals and we will tailor a rollout plan for your team.</p>
                </div>
                <button
                  aria-label="Close sales inquiry"
                  onClick={closeSales}
                  className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              {success ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={26} className="text-emerald-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Thanks, we got your request.</h4>
                  <p className="text-sm text-gray-500 mt-1">Our team will contact you shortly.</p>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                    <input className="px-4 py-3 rounded-xl border border-gray-200 text-sm" placeholder="Full name"
                      value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
                    <input className="px-4 py-3 rounded-xl border border-gray-200 text-sm" placeholder="Work email"
                      value={form.email} onChange={(e) => update('email', e.target.value)} />
                    <input className="px-4 py-3 rounded-xl border border-gray-200 text-sm" placeholder="Company name"
                      value={form.company} onChange={(e) => update('company', e.target.value)} />
                    <input className="px-4 py-3 rounded-xl border border-gray-200 text-sm" placeholder="Role / Department"
                      value={form.role} onChange={(e) => update('role', e.target.value)} />
                    <select className="px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white"
                      value={form.team_size} onChange={(e) => update('team_size', e.target.value)}>
                      <option value="">Team size</option>
                      {TEAM_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                    <select className="px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white"
                      value={form.interest_area} onChange={(e) => update('interest_area', e.target.value)}>
                      <option value="">Topic of interest</option>
                      {INTEREST_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <textarea
                    className="w-full min-h-28 px-4 py-3 rounded-xl border border-gray-200 text-sm mb-3"
                    placeholder="What challenge do you want to solve?"
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                  />

                  {error ? <p className="text-sm text-red-500 mb-3">{error}</p> : null}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button
                      className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-blue-600 to-violet-600 disabled:opacity-50"
                      onClick={onSubmit}
                      disabled={!canSubmit || loading}
                    >
                      {loading ? <><Loader2 size={14} className="animate-spin mr-2" />Submitting...</> : 'Submit inquiry'}
                    </button>
                    <p className="text-xs text-gray-500">Sales: sales@avantikaflow.ai • Support: support@avantikaflow.ai</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
