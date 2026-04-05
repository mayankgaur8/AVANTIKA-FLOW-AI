import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

interface NameYourTeamModalProps {
  isOpen: boolean;
  token: string;
  initialValue?: string;
  onComplete: () => Promise<void>;
}

export const NameYourTeamModal: React.FC<NameYourTeamModalProps> = ({ isOpen, token, initialValue = '', onComplete }) => {
  const { addToast } = useToast();
  const [teamName, setTeamName] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  const canSubmit = teamName.trim().length >= 2 && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await api.createTeam(token, teamName.trim());
      addToast('Workspace created successfully', 'success');
      await onComplete();
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Failed to create workspace', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[140] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: 'rgba(4,10,22,0.72)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ y: 18, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.97, opacity: 0 }}
            className="w-full max-w-md rounded-3xl border border-gray-200 bg-white text-gray-900 p-7 shadow-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-100 mx-auto flex items-center justify-center mb-4">
              <Building2 size={22} className="text-violet-600" />
            </div>
            <h2 className="text-3xl font-black text-center">Name your team</h2>
            <p className="text-gray-500 text-sm mt-2 text-center">Create your first workspace to continue.</p>

            <input
              className="mt-6 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400"
              placeholder="IT Team"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />

            <button
              onClick={submit}
              disabled={!canSubmit}
              className="mt-5 w-full rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 disabled:opacity-50"
            >
              {loading ? <span className="inline-flex items-center"><Loader2 size={14} className="animate-spin mr-2" />Creating...</span> : 'Get Started!'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
