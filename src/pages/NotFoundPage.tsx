import { motion } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <section className="min-h-[70vh] flex items-center justify-center px-5 md:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-md"
        >
          {/* 404 number */}
          <motion.div
            className="text-[120px] font-black leading-none select-none mb-4 bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4))' }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            404
          </motion.div>

          <h1 className="text-3xl font-black text-white mb-3">Page not found</h1>
          <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>

          <div className="flex items-center justify-center gap-3">
            <motion.button
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <ArrowLeft size={14} /> Go back
            </motion.button>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <Home size={14} /> Go home
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </PageLayout>
  );
}
