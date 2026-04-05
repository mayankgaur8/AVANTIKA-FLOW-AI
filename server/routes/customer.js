/**
 * /api/customer/* — Customer-Facing Team Workflow Builders
 *
 * customerType 'onboarding' → /customer/onboarding-flows
 * customerType 'support'    → /customer/support-playbooks
 * customerType 'demo'       → /customer/demo-guides
 * customerType 'sales'      → /customer/sales-workflows
 */

const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const {
  usersById,
  createGuideRecord,
  upsertGuideSteps,
  addGuideActivity,
} = require('../db/store');

const router = express.Router();

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'dev-secret');
    const user = usersById.get(decoded.sub);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid session' });
  }
};

const ONBOARDING_STEPS = {
  saas: [
    { title: 'Welcome kickoff and goals alignment', description: 'Schedule a kickoff call with customer champion. Align goals, success metrics, implementation scope, and timeline.', action_type: 'onboarding' },
    { title: 'Account setup and team invites', description: 'Provision workspace, configure SSO if needed, invite stakeholders, and verify role-based access assignments.', action_type: 'setup' },
    { title: 'Core feature activation checklist', description: 'Guide customer through initial setup of key features required for first value realization within 7 days.', action_type: 'activation' },
    { title: 'Role-based onboarding tracks', description: 'Assign customized onboarding for admin, manager, and end-user personas with targeted walkthroughs.', action_type: 'training' },
    { title: 'First value milestone review', description: 'Validate completion of activation milestones and remove blockers. Confirm customer has reached first measurable value.', action_type: 'verification' },
    { title: 'Adoption health checkpoint', description: 'Review activation percentage, drop-off points, and feature usage. Trigger intervention plan for low-adoption segments.', action_type: 'monitoring' },
    { title: 'Go-live sign-off and handoff', description: 'Finalize onboarding completion, capture stakeholder sign-off, and transition to ongoing success motion.', action_type: 'handoff' },
  ],
  enterprise: [
    { title: 'Executive alignment and governance setup', description: 'Define executive sponsor, steering committee, program owner, and governance cadence for enterprise rollout.', action_type: 'onboarding' },
    { title: 'Security and compliance readiness', description: 'Complete security questionnaires, data processing review, and legal/compliance approvals before deployment.', action_type: 'security' },
    { title: 'Integration architecture planning', description: 'Map system integrations (CRM, ERP, support tools), data flows, and ownership for each integration workstream.', action_type: 'planning' },
    { title: 'Pilot cohort launch', description: 'Run controlled pilot with a representative team. Measure time-to-value, adoption friction, and enablement gaps.', action_type: 'activation' },
    { title: 'Enablement by department', description: 'Deploy tailored onboarding content by role and business unit. Include admin certification and manager guides.', action_type: 'training' },
    { title: 'Rollout phase gates', description: 'Advance from pilot to phased rollout only after predefined success thresholds are met.', action_type: 'verification' },
    { title: 'Business impact review', description: 'Measure KPI movement vs baseline: activation, productivity, and retention metrics. Report to steering committee.', action_type: 'monitoring' },
  ],
  product: [
    { title: 'Product-specific onboarding objective', description: 'Define what successful onboarding looks like for this product line and target user segment.', action_type: 'planning' },
    { title: 'Guided setup walkthrough', description: 'Provide step-by-step setup path with in-app cues and annotated guidance.', action_type: 'setup' },
    { title: 'Feature discovery sequence', description: 'Introduce features in progressive sequence from basics to power-user capabilities.', action_type: 'training' },
    { title: 'Activation milestone checks', description: 'Track milestone completion and trigger contextual nudges for incomplete steps.', action_type: 'activation' },
    { title: 'Segment-specific optimization', description: 'Personalize next-best actions based on customer segment behavior and usage patterns.', action_type: 'optimization' },
    { title: 'Onboarding completion and score', description: 'Compute onboarding score and recommend expansion path for high-potential accounts.', action_type: 'monitoring' },
  ],
};

const SUPPORT_STEPS = {
  technical: [
    { title: 'Capture complete issue context', description: 'Collect ticket summary, affected feature, reproduction steps, logs, screenshots, and user impact severity.', action_type: 'triage' },
    { title: 'AI issue classification', description: 'Classify issue type, severity, and probable root cause cluster using historical ticket patterns.', action_type: 'analysis' },
    { title: 'Run diagnostic flow', description: 'Execute guided diagnosis checks in order: environment, permissions, integrations, recent changes.', action_type: 'diagnosis' },
    { title: 'Generate response draft', description: 'Auto-create customer-facing response with clear explanation, ETA, and immediate workaround if available.', action_type: 'response' },
    { title: 'Resolve and validate', description: 'Apply fix, validate with customer, and confirm issue closure criteria are met.', action_type: 'resolution' },
    { title: 'Save playbook for reuse', description: 'Store issue pattern and successful response in knowledge base for next-time auto-suggestion.', action_type: 'documentation' },
  ],
  billing: [
    { title: 'Capture billing issue details', description: 'Collect invoice ID, account, charge amount, date, and customer claim details.', action_type: 'triage' },
    { title: 'AI billing anomaly detection', description: 'Check for duplicate charges, incorrect plan mapping, or proration anomalies.', action_type: 'analysis' },
    { title: 'Policy and contract validation', description: 'Verify charge behavior against current plan terms and contract exceptions.', action_type: 'verification' },
    { title: 'Draft billing response and options', description: 'Generate customer response including explanation, credit/refund options, and next steps.', action_type: 'response' },
    { title: 'Escalation routing if required', description: 'Route to finance or account management for non-standard contractual exceptions.', action_type: 'escalation' },
    { title: 'Close and catalog resolution', description: 'Record final decision and update billing playbook with scenario tags.', action_type: 'documentation' },
  ],
  general: [
    { title: 'Capture issue and impact', description: 'Collect user-reported issue context with severity and expected outcome.', action_type: 'triage' },
    { title: 'AI category and urgency scoring', description: 'Classify issue category and recommended SLA based on historical outcomes.', action_type: 'analysis' },
    { title: 'Guided troubleshooting and reply', description: 'Follow standardized troubleshooting steps and generate consistent response.', action_type: 'response' },
    { title: 'Resolution verification', description: 'Confirm issue is fully resolved and customer acknowledges completion.', action_type: 'resolution' },
    { title: 'Knowledge base update', description: 'Save refined response flow for team reuse and continuous learning.', action_type: 'documentation' },
  ],
};

const DEMO_STEPS = {
  product: [
    { title: 'Define audience and success criteria', description: 'Identify persona, industry context, and desired post-demo action.', action_type: 'planning' },
    { title: 'Opening narrative and agenda', description: 'Use a concise intro script that frames business problem and expected value.', action_type: 'storytelling' },
    { title: 'Core feature walkthrough', description: 'Demonstrate high-impact workflows with explicit outcomes, not just clicks.', action_type: 'demo' },
    { title: 'Annotated media highlights', description: 'Embed clips/screenshots with talk-track notes and objection handling prompts.', action_type: 'media' },
    { title: 'AI flow optimization', description: 'Optimize sequence and simplify explanations based on win-rate patterns.', action_type: 'optimization' },
    { title: 'Close with next-step CTA', description: 'End with clear implementation path, timeline, and follow-up commitments.', action_type: 'conversion' },
  ],
  feature: [
    { title: 'Select feature narrative arc', description: 'Frame feature in terms of pain solved, workflow change, and measurable impact.', action_type: 'planning' },
    { title: 'Setup minimal demo environment', description: 'Prepare clean dataset and scenario-specific account state for smooth walkthrough.', action_type: 'setup' },
    { title: 'Live feature walkthrough', description: 'Demonstrate end-to-end use case with concise script and value checkpoints.', action_type: 'demo' },
    { title: 'Add proof points and FAQs', description: 'Insert benchmark claims, customer proof points, and common objection responses.', action_type: 'storytelling' },
    { title: 'AI weak-point detection', description: 'Flag confusing sections and suggest clearer transitions and examples.', action_type: 'optimization' },
    { title: 'CTA and follow-up package', description: 'Provide trial task, relevant docs, and next meeting agenda for momentum.', action_type: 'conversion' },
  ],
  enterprise: [
    { title: 'Map multi-stakeholder agenda', description: 'Align demo sections to executive, technical, and operational stakeholders.', action_type: 'planning' },
    { title: 'Business case framing', description: 'Quantify current-state cost and expected ROI from adoption.', action_type: 'storytelling' },
    { title: 'Security, compliance, and scale walkthrough', description: 'Cover governance, controls, integrations, and deployment model.', action_type: 'demo' },
    { title: 'Role-specific workflow demo', description: 'Show practical workflows for each buyer group with tailored talking points.', action_type: 'demo' },
    { title: 'AI narrative refinement', description: 'Tune sequencing, reduce complexity, and highlight strongest conversion moments.', action_type: 'optimization' },
    { title: 'Procurement-ready close', description: 'Summarize outcomes and provide clear path to pilot/procurement kickoff.', action_type: 'conversion' },
  ],
};

const SALES_STEPS = {
  qualification: [
    { title: 'Lead intake and enrichment', description: 'Capture lead source, firmographics, and intent signals. Enrich automatically from CRM tools.', action_type: 'qualification' },
    { title: 'AI qualification scoring', description: 'Score lead using fit + intent model and recommend next best action.', action_type: 'analysis' },
    { title: 'Discovery prep script', description: 'Generate role-specific discovery questions and risk assumptions before first call.', action_type: 'messaging' },
    { title: 'Objection handling paths', description: 'Add branch-specific responses for pricing, security, and timing objections.', action_type: 'messaging' },
    { title: 'Progression criteria', description: 'Define explicit criteria to move from MQL to SQL to opportunity stage.', action_type: 'workflow' },
    { title: 'Performance tracking loop', description: 'Track conversion by segment and feed patterns back into qualification playbook.', action_type: 'monitoring' },
  ],
  discovery: [
    { title: 'Pre-call account research', description: 'Compile business context, ICP fit, and known pain signals before meeting.', action_type: 'planning' },
    { title: 'Discovery conversation framework', description: 'Use structured script for current state, blockers, goals, and urgency.', action_type: 'messaging' },
    { title: 'AI-assisted question prompts', description: 'Suggest dynamic follow-up questions based on buyer responses in real time.', action_type: 'analysis' },
    { title: 'Pain-to-value mapping', description: 'Translate identified pains into relevant product outcomes and proof points.', action_type: 'positioning' },
    { title: 'Next-step commitment capture', description: 'Secure clear action items, stakeholders, and timeline before call close.', action_type: 'workflow' },
    { title: 'Deal progression score', description: 'Assess call quality and probability of progression based on discovery signals.', action_type: 'monitoring' },
  ],
  proposal: [
    { title: 'Proposal qualification gate', description: 'Verify buying committee, budget posture, and decision timeline before proposal.', action_type: 'qualification' },
    { title: 'Tailored proposal structure', description: 'Build proposal aligned to pains, success metrics, and implementation plan.', action_type: 'positioning' },
    { title: 'AI messaging optimization', description: 'Refine proposal language for clarity, urgency, and stakeholder resonance.', action_type: 'analysis' },
    { title: 'Risk and objection section', description: 'Preempt legal, security, and cost objections with documented responses.', action_type: 'messaging' },
    { title: 'Commercial workflow and approvals', description: 'Standardize discount approvals and commercial review checkpoints.', action_type: 'workflow' },
    { title: 'Conversion tracking and win-loss learnings', description: 'Capture proposal outcomes and iterate playbook with win/loss insights.', action_type: 'monitoring' },
  ],
};

const normalizeSteps = (steps) => steps.map((s, i) => ({ ...s, step_number: i + 1 }));

router.post('/generate', requireAuth, (req, res) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(140).required(),
    description: Joi.string().trim().allow('').max(2500).default(''),
    customerType: Joi.string().valid('onboarding', 'support', 'demo', 'sales').required(),
    templateType: Joi.string().allow('').max(40).default(''),
    issueType: Joi.string().allow('').max(40).default(''),
    demoType: Joi.string().allow('').max(40).default(''),
    salesProcess: Joi.string().allow('').max(40).default(''),
    segment: Joi.string().allow('').max(60).default(''),
  });

  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  let steps = [];
  let aiInsights = [];

  if (value.customerType === 'onboarding') {
    const key = value.templateType || 'saas';
    const set = ONBOARDING_STEPS[key] || ONBOARDING_STEPS.saas;
    steps = normalizeSteps(set);
    aiInsights = [
      'Generated onboarding journey from selected template',
      'Added activation milestone checkpoints',
      'Included drop-off and completion tracking hooks',
      value.segment ? `Personalized for segment: ${value.segment}` : 'Applied default SaaS segmentation model',
    ];
  } else if (value.customerType === 'support') {
    const key = value.issueType || 'general';
    const set = SUPPORT_STEPS[key] || SUPPORT_STEPS.general;
    steps = normalizeSteps(set);
    aiInsights = [
      'Classified issue type and response path',
      'Generated consistent customer-facing replies',
      'Added root-cause diagnosis sequence',
      'Prepared playbook for future auto-suggestions',
    ];
  } else if (value.customerType === 'demo') {
    const key = value.demoType || 'product';
    const set = DEMO_STEPS[key] || DEMO_STEPS.product;
    steps = normalizeSteps(set);
    aiInsights = [
      'Generated narrative-first demo script',
      'Inserted key talking point transitions',
      'Flagged weak storytelling sections for improvement',
      'Optimized closing sequence for conversion momentum',
    ];
  } else {
    const key = value.salesProcess || 'qualification';
    const set = SALES_STEPS[key] || SALES_STEPS.qualification;
    steps = normalizeSteps(set);
    aiInsights = [
      'Generated stage-specific sales playbook',
      'Added objection-handling and messaging prompts',
      'Inserted progression criteria and role assignments',
      'Added performance instrumentation for conversion tracking',
    ];
  }

  return res.json({
    success: true,
    title: value.title,
    steps,
    aiInsights,
    customerType: value.customerType,
  });
});

router.post('/create', requireAuth, (req, res) => {
  const stepSchema = Joi.object({
    title: Joi.string().trim().min(1).max(160).required(),
    description: Joi.string().allow('').max(2500).default(''),
    action_type: Joi.string().trim().max(80).default('action'),
    order: Joi.number().integer().min(1).optional(),
    role: Joi.string().allow('').max(80).default(''),
    tip: Joi.string().allow('').max(600).default(''),
    script: Joi.string().allow('').max(2000).default(''),
    media_url: Joi.string().allow('').max(2048).default(''),
    required: Joi.boolean().default(false),
  });

  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(140).required(),
    description: Joi.string().allow('').max(2500).default(''),
    source: Joi.string().valid('onboarding', 'support', 'demo', 'sales').required(),
    status: Joi.string().valid('draft', 'published').default('draft'),
    category: Joi.string().allow('').max(80).default(''),
    tags: Joi.array().items(Joi.string().max(40)).max(12).default([]),
    steps: Joi.array().items(stepSchema).min(1).max(80).required(),
  });

  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  if (!req.user.workspace_id) {
    return res.status(409).json({ success: false, message: 'Create a workspace before building customer workflows' });
  }

  try {
    const guide = createGuideRecord({
      title: value.title,
      description: value.description,
      workspaceId: req.user.workspace_id,
      ownerUserId: req.user.id,
      status: value.status,
      source: value.source,
    });

    const ordered = [...value.steps]
      .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
      .map((step, i) => ({
        title: step.title,
        description: step.description,
        action_type: step.action_type,
        step_number: i + 1,
        metadata_json: {
          role: step.role,
          tip: step.tip,
          script: step.script,
          media_url: step.media_url,
          required: step.required,
          category: value.category,
          tags: value.tags,
        },
      }));

    const steps = upsertGuideSteps(guide.id, ordered);

    addGuideActivity({
      guideId: guide.id,
      workspaceId: req.user.workspace_id,
      type: 'edited',
      userId: req.user.id,
      metadata: { title: value.title, source: value.source, action: 'customer_workflow_create' },
    });

    return res.status(201).json({ success: true, guide, steps });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Unable to save customer workflow' });
  }
});

module.exports = router;
