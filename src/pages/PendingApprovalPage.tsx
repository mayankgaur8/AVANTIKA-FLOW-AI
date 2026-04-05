import { Link } from 'react-router-dom';
import { Navigation } from '../components/Navigation';

export const PendingApprovalPage = () => {
  return (
    <div className="min-h-screen" style={{ background: '#050c18' }}>
      <Navigation />
      <main className="max-w-3xl mx-auto px-6 py-24">
        <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center">
          <h1 className="text-4xl text-white font-black">We’re reviewing your access</h1>
          <p className="text-white/65 mt-4 text-lg">Thanks for signing up. Our team is validating your workspace access. We’ll notify you by email shortly.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/" className="px-6 py-3 rounded-xl bg-white/10 text-white">Return home</Link>
            <Link to="/contact" className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white">Contact support</Link>
          </div>
        </section>
      </main>
    </div>
  );
};
