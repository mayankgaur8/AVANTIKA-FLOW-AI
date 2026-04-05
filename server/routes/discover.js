const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const { usersById } = require('../db/store');

const router = express.Router();

const CASE_STUDIES = [
  {
    id: 'cs-ops-onboarding',
    company_name: 'Acme Corp',
    industry: 'SaaS',
    problem: 'Employee onboarding was inconsistent across regions and took too long to complete.',
    solution: 'Used Workflow AI capture plus training builder to standardize onboarding into one reusable flow.',
    result_metrics: {
      time_saved: '72%',
      efficiency_improvement: '3.4x faster onboarding completion',
      cost_reduction: '38% lower training overhead',
      roi_impact: '$420K annual productivity gain',
    },
    workflow_id: 'wf-onboarding-v3',
    role_fit: ['operations', 'hr', 'people-ops'],
    before_after: {
      before: '3 weeks average time-to-productivity with 11 manual handoffs',
      after: '3 days average time-to-productivity with 4 guided checkpoints',
    },
  },
  {
    id: 'cs-it-incidents',
    company_name: 'NorthGrid Systems',
    industry: 'IT Services',
    problem: 'Incident response was fragmented and postmortems lacked repeatable actions.',
    solution: 'Built runbook workflows and integrated retrieval in chat channels for instant execution.',
    result_metrics: {
      time_saved: '56%',
      efficiency_improvement: '2.1x faster MTTR',
      cost_reduction: '29% fewer escalation hours',
      roi_impact: '$280K annual incident savings',
    },
    workflow_id: 'wf-it-runbook-v2',
    role_fit: ['it', 'devops', 'engineering'],
    before_after: {
      before: 'Median MTTR 4.2 hours with inconsistent owner assignment',
      after: 'Median MTTR 2.0 hours with guided role-based actions',
    },
  },
  {
    id: 'cs-finance-ap',
    company_name: 'BlueLedger Finance',
    industry: 'Fintech',
    problem: 'Invoice approvals were delayed by duplicate checks and unclear policy routing.',
    solution: 'Applied optimization engine to remove redundant approvals and enforce policy gates.',
    result_metrics: {
      time_saved: '49%',
      efficiency_improvement: '1.9x faster invoice cycle',
      cost_reduction: '24% lower AP processing cost',
      roi_impact: '$190K annual AP savings',
    },
    workflow_id: 'wf-finance-invoice-v4',
    role_fit: ['finance', 'accounting', 'operations'],
    before_after: {
      before: '9.5 days average invoice turnaround with 3 duplicate validation steps',
      after: '4.8 days average turnaround with automated policy checks',
    },
  },
  {
    id: 'cs-customer-support',
    company_name: 'HelioCX',
    industry: 'Customer Experience',
    problem: 'Support quality varied by agent and repeated issues were not reused effectively.',
    solution: 'Deployed case-linked support playbooks and AI recommendations for response quality.',
    result_metrics: {
      time_saved: '41%',
      efficiency_improvement: '32% faster first resolution',
      cost_reduction: '18% lower support handling cost',
      roi_impact: '$240K annual support efficiency gain',
    },
    workflow_id: 'wf-support-playbook-v5',
    role_fit: ['customer-success', 'support', 'operations'],
    before_after: {
      before: 'Resolution quality varied by agent and queue',
      after: 'Consistent response flow with reusable diagnosis trees',
    },
  },
];

const REVIEWS = [
  {
    id: 'rv-1',
    user_name: 'Sarah Chen',
    role: 'Head of Operations',
    company: 'Acme Corp',
    rating: 5,
    comment: 'We converted scattered SOPs into one AI workflow engine and cut onboarding from weeks to days.',
    use_case: 'Ops',
    company_size: '201-1000',
    impact: { time_saved: '65%', efficiency_improvement: '2.8x', cost_reduction: '31%' },
  },
  {
    id: 'rv-2',
    user_name: 'Daniel Ortiz',
    role: 'IT Director',
    company: 'NorthGrid Systems',
    rating: 5,
    comment: 'Runbooks are now discoverable in chat and our incident response is finally consistent.',
    use_case: 'IT',
    company_size: '1001-5000',
    impact: { time_saved: '52%', efficiency_improvement: '2.1x', cost_reduction: '26%' },
  },
  {
    id: 'rv-3',
    user_name: 'Meera Patel',
    role: 'Finance Controller',
    company: 'BlueLedger Finance',
    rating: 4,
    comment: 'Approval workflows are clearer and we eliminated duplicate review loops.',
    use_case: 'Finance',
    company_size: '51-200',
    impact: { time_saved: '39%', efficiency_improvement: '1.7x', cost_reduction: '19%' },
  },
  {
    id: 'rv-4',
    user_name: 'Noah Kim',
    role: 'VP Customer Success',
    company: 'HelioCX',
    rating: 5,
    comment: 'Support playbooks are actionable and the AI suggestions keep improving each month.',
    use_case: 'Customer',
    company_size: '201-1000',
    impact: { time_saved: '44%', efficiency_improvement: '2.0x', cost_reduction: '17%' },
  },
  {
    id: 'rv-5',
    user_name: 'Priya Sharma',
    role: 'People Operations Lead',
    company: 'PeopleStack',
    rating: 4,
    comment: 'Training guides and onboarding checklists became repeatable across every office.',
    use_case: 'HR',
    company_size: '201-1000',
    impact: { time_saved: '46%', efficiency_improvement: '1.9x', cost_reduction: '21%' },
  },
];

const SPOTLIGHTS = [
  {
    id: 'sp-acme',
    company_name: 'Acme Corp',
    highlight: 'Cut onboarding time from 3 weeks to 3 days',
    testimonial: 'Avantika Flow AI gave us one workflow engine instead of ten disconnected process docs.',
    metrics: {
      time_saved: '72%',
      efficiency_improvement: '3.4x faster onboarding completion',
      cost_reduction: '38%',
    },
    case_study_id: 'cs-ops-onboarding',
  },
  {
    id: 'sp-northgrid',
    company_name: 'NorthGrid Systems',
    highlight: 'Reduced incident MTTR by more than half',
    testimonial: 'Our teams now execute runbooks confidently from chat without context switching.',
    metrics: {
      time_saved: '56%',
      efficiency_improvement: '2.1x faster MTTR',
      cost_reduction: '29%',
    },
    case_study_id: 'cs-it-incidents',
  },
];

const WORKFLOW_TEMPLATES = {
  'wf-onboarding-v3': {
    title: 'Employee Onboarding Workflow',
    steps: [
      { title: 'Prepare preboarding assets', description: 'Set up accounts, welcome docs, and required equipment.', action_type: 'setup', order: 1 },
      { title: 'Run day-one orientation', description: 'Guide employee through policies, tooling, and role expectations.', action_type: 'training', order: 2 },
      { title: 'Track first-week milestones', description: 'Validate completion of key checkpoints and remove blockers.', action_type: 'monitoring', order: 3 },
    ],
  },
  'wf-it-runbook-v2': {
    title: 'Incident Response Runbook',
    steps: [
      { title: 'Triage incident severity', description: 'Classify impact and assign incident owner.', action_type: 'analysis', order: 1 },
      { title: 'Execute guided remediation', description: 'Follow runbook sequence with checkpoints and rollback rules.', action_type: 'action', order: 2 },
      { title: 'Verify recovery and log learnings', description: 'Confirm stability and add findings to knowledge base.', action_type: 'verification', order: 3 },
    ],
  },
  'wf-finance-invoice-v4': {
    title: 'Invoice Processing Optimization Workflow',
    steps: [
      { title: 'Capture invoice data', description: 'Extract and validate vendor, amount, and due date details.', action_type: 'data-entry', order: 1 },
      { title: 'Run policy routing', description: 'Send to correct approver based on spend and category.', action_type: 'approval', order: 2 },
      { title: 'Finalize payment handoff', description: 'Post approved invoice and schedule payment execution.', action_type: 'verification', order: 3 },
    ],
  },
  'wf-support-playbook-v5': {
    title: 'Support Resolution Playbook',
    steps: [
      { title: 'Classify issue cluster', description: 'Tag issue and map to diagnosis branch.', action_type: 'analysis', order: 1 },
      { title: 'Run guided checks', description: 'Follow diagnostic path and capture required evidence.', action_type: 'diagnosis', order: 2 },
      { title: 'Close with reusable notes', description: 'Publish final resolution and update support knowledge base.', action_type: 'documentation', order: 3 },
    ],
  },
};

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

const summarizeCaseStudy = (study) => {
  const summary = `${study.company_name} (${study.industry}) solved ${study.problem.toLowerCase()} and achieved ${study.result_metrics.efficiency_improvement}.`;
  return summary;
};

const recommendCaseStudyIds = (role) => {
  if (!role) return CASE_STUDIES.slice(0, 2).map((c) => c.id);
  const normalized = role.toLowerCase();
  const recommended = CASE_STUDIES
    .filter((c) => c.role_fit.some((r) => normalized.includes(r)))
    .map((c) => c.id);
  return recommended.length ? recommended : CASE_STUDIES.slice(0, 2).map((c) => c.id);
};

const reviewInsights = (reviews) => {
  const avgRating = reviews.length
    ? Number((reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / reviews.length).toFixed(2))
    : 0;

  const benefits = {
    time_saved: 0,
    efficiency_improvement: 0,
    cost_reduction: 0,
  };

  for (const r of reviews) {
    if (r.impact?.time_saved) benefits.time_saved += 1;
    if (r.impact?.efficiency_improvement) benefits.efficiency_improvement += 1;
    if (r.impact?.cost_reduction) benefits.cost_reduction += 1;
  }

  const sentiment = avgRating >= 4.5 ? 'Strongly Positive' : avgRating >= 4 ? 'Positive' : 'Mixed';

  return {
    avg_rating: avgRating,
    sentiment_trend: sentiment,
    key_benefits: [
      `Time saved mentioned in ${benefits.time_saved}/${reviews.length || 1} reviews`,
      `Efficiency improvements highlighted in ${benefits.efficiency_improvement}/${reviews.length || 1} reviews`,
      `Cost reduction outcomes highlighted in ${benefits.cost_reduction}/${reviews.length || 1} reviews`,
    ],
  };
};

router.get('/case-studies', (req, res) => {
  const schema = Joi.object({ role: Joi.string().allow('').max(80).default('') });
  const { error, value } = schema.validate(req.query, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid query' });

  const studies = CASE_STUDIES.map((study) => ({ ...study, ai_summary: summarizeCaseStudy(study) }));
  return res.json({
    success: true,
    caseStudies: studies,
    recommendedCaseStudyIds: recommendCaseStudyIds(value.role),
  });
});

router.get('/case-studies/:id', (req, res) => {
  const study = CASE_STUDIES.find((c) => c.id === req.params.id);
  if (!study) return res.status(404).json({ success: false, message: 'Case study not found' });

  const workflow = WORKFLOW_TEMPLATES[study.workflow_id] || null;

  return res.json({
    success: true,
    caseStudy: {
      ...study,
      ai_summary: summarizeCaseStudy(study),
      workflow,
      suggested_workflows: recommendCaseStudyIds(study.role_fit[0]).map((id) => {
        const found = CASE_STUDIES.find((c) => c.id === id);
        return found ? { id: found.id, title: found.solution, workflow_id: found.workflow_id } : null;
      }).filter(Boolean),
    },
  });
});

router.post('/case-studies/:id/generate-similar', requireAuth, (req, res) => {
  const schema = Joi.object({ prompt: Joi.string().trim().allow('').max(600).default('') });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid request' });

  const study = CASE_STUDIES.find((c) => c.id === req.params.id);
  if (!study) return res.status(404).json({ success: false, message: 'Case study not found' });

  const baseWorkflow = WORKFLOW_TEMPLATES[study.workflow_id];
  const context = value.prompt || study.problem;
  const steps = (baseWorkflow?.steps || []).map((s, i) => ({
    ...s,
    description: `${s.description} Context adaptation: ${context}.`,
    order: i + 1,
  }));

  return res.json({
    success: true,
    title: `${study.company_name} style solution`,
    steps,
    aiInsights: [
      'Generated a similar workflow from proven customer pattern',
      'Adapted step language for your business context',
      'Included outcome-oriented checkpoints based on case study metrics',
    ],
  });
});

router.get('/workflows/:workflowId', (req, res) => {
  const workflow = WORKFLOW_TEMPLATES[req.params.workflowId];
  if (!workflow) return res.status(404).json({ success: false, message: 'Workflow template not found' });
  return res.json({ success: true, workflow });
});

router.get('/reviews', (req, res) => {
  const schema = Joi.object({
    useCase: Joi.string().allow('').max(40).default(''),
    companySize: Joi.string().allow('').max(40).default(''),
  });
  const { error, value } = schema.validate(req.query, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid query' });

  let filtered = [...REVIEWS];
  if (value.useCase) filtered = filtered.filter((r) => r.use_case.toLowerCase() === value.useCase.toLowerCase());
  if (value.companySize) filtered = filtered.filter((r) => r.company_size === value.companySize);

  return res.json({
    success: true,
    reviews: filtered,
    insights: reviewInsights(filtered),
  });
});

router.get('/spotlight', (req, res) => {
  const featured = SPOTLIGHTS[0] || null;
  return res.json({ success: true, featured, spotlights: SPOTLIGHTS });
});

router.get('/spotlight/:id', (req, res) => {
  const spotlight = SPOTLIGHTS.find((s) => s.id === req.params.id);
  if (!spotlight) return res.status(404).json({ success: false, message: 'Spotlight not found' });

  const caseStudy = CASE_STUDIES.find((c) => c.id === spotlight.case_study_id) || null;
  return res.json({
    success: true,
    spotlight: {
      ...spotlight,
      ai_summary: `${spotlight.company_name} achieved ${spotlight.metrics.efficiency_improvement} after adopting AI workflow automation.`,
      caseStudy,
    },
  });
});

module.exports = router;
