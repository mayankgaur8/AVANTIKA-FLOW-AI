import { Link } from 'react-router-dom';

export const RejectedAccessPage = () => {
  return (
    <div className="min-h-screen bg-[#050c18] flex items-center justify-center px-6">
      <section className="max-w-2xl w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center">
        <h1 className="text-4xl font-black text-white">Access request not approved</h1>
        <p className="text-white/65 mt-3">Your request is currently rejected. Contact support if you believe this is a mistake.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="px-6 py-3 rounded-xl bg-white/10 text-white">Back home</Link>
          <Link to="/contact" className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white">Contact support</Link>
        </div>
      </section>
    </div>
  );
};
