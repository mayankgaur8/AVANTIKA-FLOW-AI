import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { ProductHero } from '../components/ProductHero';

export const WorkflowAIPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070c1b]">
      <div style={{ background: '#050c18' }}><Navigation /></div>
      <ProductHero
        dark
        badge="Workflow AI"
        title="Uplevel how your company works"
        subtitle="The central AI engine for SOP creation, process documentation, training guides, and runbooks across your organization."
        primaryCta={
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/workflow-ai/record')}
              className="px-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-violet-600"
            >
              Start Recording
            </button>
            <button
              onClick={() => navigate('/workflow-ai/examples')}
              className="px-6 py-3 rounded-xl text-gray-700 font-semibold border border-gray-300 bg-white"
            >
              View Examples
            </button>
          </div>
        }
        secondaryCta={
          <button
            onClick={() => navigate('/workflow-ai/templates')}
            className="px-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500"
          >
            AI Templates
          </button>
        }
        rightVisual={<div className="h-72 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-pink-500/20" />}
      />

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6" style={{ background: 'rgba(8,14,30,0.92)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs tracking-[0.18em] text-blue-300 font-semibold">STEP 1: CHOOSE WORKFLOW TYPE</p>
            <div className="mt-3 grid sm:grid-cols-2 gap-2">
              {[
                { label: 'SOP creation', to: '/workflow-ai/sop-builder' },
                { label: 'Process documentation', to: '/workflow-ai/process-capture' },
                { label: 'Training guide', to: '/workflow-ai/training-builder' },
                { label: 'Runbook', to: '/workflow-ai/templates' },
              ].map((item) => (
                <button key={item.label} onClick={() => navigate(item.to)} className="rounded-lg px-3 py-2 text-sm text-white/80 text-left" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  {item.label}
                </button>
              ))}
            </div>

            <p className="mt-5 text-xs tracking-[0.18em] text-blue-300 font-semibold">STEP 2: CHOOSE INPUT METHOD</p>
            <div className="mt-3 space-y-2">
              <button onClick={() => navigate('/workflow-ai/record')} className="w-full rounded-lg px-3 py-2 text-sm text-left text-white/80" style={{ background: 'rgba(255,255,255,0.06)' }}>Record workflow</button>
              <button onClick={() => navigate('/workflow-ai/templates')} className="w-full rounded-lg px-3 py-2 text-sm text-left text-white/80" style={{ background: 'rgba(255,255,255,0.06)' }}>Prompt-driven generation</button>
              <button onClick={() => navigate('/workflow-ai/examples')} className="w-full rounded-lg px-3 py-2 text-sm text-left text-white/80" style={{ background: 'rgba(255,255,255,0.06)' }}>Upload/reference examples</button>
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ background: 'rgba(8,14,30,0.92)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs tracking-[0.18em] text-emerald-300 font-semibold">STEP 3-4: GENERATE, EXECUTE, SCALE</p>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              <li>AI generates full workflows with structured steps and metadata tags.</li>
              <li>Assign workflows to teams and monitor adoption from one platform.</li>
              <li>Publish reusable versions to power integrations and agent automation.</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => navigate('/dashboard/team')} className="px-4 py-2 rounded-lg text-sm text-white/85" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)' }}>
                Assign to team
              </button>
              <button onClick={() => navigate('/dashboard/recent')} className="px-4 py-2 rounded-lg text-sm text-white/85" style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
                Track usage
              </button>
              <button onClick={() => navigate('/platform/integrations')} className="px-4 py-2 rounded-lg text-sm text-white/85" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}>
                Open integrations
              </button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};
