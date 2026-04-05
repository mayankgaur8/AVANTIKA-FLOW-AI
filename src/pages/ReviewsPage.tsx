import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { api, type Review, type ReviewInsights } from '../lib/api';

const USE_CASES = ['All', 'Ops', 'IT', 'Finance', 'Customer', 'HR'];
const COMPANY_SIZES = ['All', '51-200', '201-1000', '1001-5000'];

export const ReviewsPage = () => {
  const [useCase, setUseCase] = useState('All');
  const [companySize, setCompanySize] = useState('All');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [insights, setInsights] = useState<ReviewInsights | null>(null);

  useEffect(() => {
    api.discoverReviews({
      useCase: useCase === 'All' ? undefined : useCase,
      companySize: companySize === 'All' ? undefined : companySize,
    })
      .then((res) => {
        setReviews(res.reviews);
        setInsights(res.insights);
      })
      .catch(() => {
        setReviews([]);
        setInsights(null);
      });
  }, [useCase, companySize]);

  const avgImpact = useMemo(() => {
    const rows = reviews.filter((r) => r.impact);
    if (!rows.length) return { time: '-', efficiency: '-', cost: '-' };

    const parsePct = (v?: string) => Number(String(v || '').replace('%', '').trim()) || 0;
    const parseX = (v?: string) => Number(String(v || '').replace('x', '').trim()) || 0;

    const time = Math.round(rows.reduce((acc, r) => acc + parsePct(r.impact?.time_saved), 0) / rows.length);
    const efficiency = (rows.reduce((acc, r) => acc + parseX(r.impact?.efficiency_improvement), 0) / rows.length).toFixed(1);
    const cost = Math.round(rows.reduce((acc, r) => acc + parsePct(r.impact?.cost_reduction), 0) / rows.length);
    return { time: `${time}%`, efficiency: `${efficiency}x`, cost: `${cost}%` };
  }, [reviews]);

  return (
    <div className="min-h-screen bg-[#070c1b]">
      <Navigation />

      <section className="max-w-6xl mx-auto px-6 pt-12 pb-6">
        <p className="text-xs text-blue-300 font-semibold tracking-[0.18em]">DISCOVER</p>
        <h1 className="text-4xl font-black text-white mt-2">Reviews</h1>
        <p className="text-white/60 mt-2">Trusted by teams across industries.</p>

        <div className="mt-4 flex gap-2 text-sm">
          <Link to="/discover/case-studies" className="px-3 py-2 rounded-lg text-white/70" style={{ background: 'rgba(255,255,255,0.08)' }}>Case Studies</Link>
          <Link to="/discover/reviews" className="px-3 py-2 rounded-lg text-blue-300" style={{ background: 'rgba(59,130,246,0.2)' }}>Reviews</Link>
          <Link to="/customers/spotlight" className="px-3 py-2 rounded-lg text-white/70" style={{ background: 'rgba(255,255,255,0.08)' }}>Customer Spotlight</Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs text-white/45 uppercase tracking-wider">Filter reviews</p>

          <div className="mt-3 space-y-2">
            <select value={useCase} onChange={(e) => setUseCase(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {USE_CASES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <select value={companySize} onChange={(e) => setCompanySize(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.12)' }}>
            <p className="text-[11px] uppercase tracking-wider text-blue-300">AI insights</p>
            <p className="text-sm text-white mt-1">Avg rating: {insights?.avg_rating ?? '-'}</p>
            <p className="text-xs text-white/70 mt-1">Sentiment trend: {insights?.sentiment_trend ?? '-'}</p>
            <div className="mt-2 space-y-1">
              {(insights?.key_benefits || []).map((k) => <p key={k} className="text-xs text-white/70">• {k}</p>)}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg p-2" style={{ background: 'rgba(16,185,129,0.16)' }}><p className="text-[10px] text-white/60">Time saved</p><p className="text-sm font-semibold text-white">{avgImpact.time}</p></div>
            <div className="rounded-lg p-2" style={{ background: 'rgba(14,165,233,0.16)' }}><p className="text-[10px] text-white/60">Efficiency</p><p className="text-sm font-semibold text-white">{avgImpact.efficiency}</p></div>
            <div className="rounded-lg p-2" style={{ background: 'rgba(168,85,247,0.16)' }}><p className="text-[10px] text-white/60">Cost</p><p className="text-sm font-semibold text-white">{avgImpact.cost}</p></div>
          </div>
        </div>

        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl p-4 transition-transform" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{review.user_name}</p>
                <p className="text-amber-300 text-sm">{'★'.repeat(review.rating)}<span className="text-white/20">{'★'.repeat(5 - review.rating)}</span></p>
              </div>
              <p className="text-xs text-white/55 mt-0.5">{review.role} · {review.company}</p>
              <p className="text-sm text-white/78 mt-3">{review.comment}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                {review.use_case ? <span className="px-2 py-1 rounded-full text-blue-300" style={{ background: 'rgba(59,130,246,0.18)' }}>{review.use_case}</span> : null}
                {review.company_size ? <span className="px-2 py-1 rounded-full text-white/70" style={{ background: 'rgba(255,255,255,0.1)' }}>{review.company_size}</span> : null}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 text-[11px] text-white/72">
                <span>Time: {review.impact?.time_saved || '-'}</span>
                <span>Eff: {review.impact?.efficiency_improvement || '-'}</span>
                <span>Cost: {review.impact?.cost_reduction || '-'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};
