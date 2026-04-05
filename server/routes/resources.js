const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const { usersById } = require('../db/store');

const router = express.Router();

const TEMPLATES = [
  {
    id: 'tpl-ops-onboarding',
    name: 'Employee Onboarding Workflow',
    category: 'Operations',
    description: 'Standard onboarding flow with role handoffs and first-week checkpoints.',
    workflow_steps: [
      { title: 'Preboarding setup', description: 'Create accounts, access, and welcome packet.', action_type: 'setup', order: 1 },
      { title: 'Day-one orientation', description: 'Run orientation checklist and role introduction.', action_type: 'training', order: 2 },
      { title: 'Week-one milestones', description: 'Track progress and close onboarding blockers.', action_type: 'monitoring', order: 3 },
    ],
    usage_count: 24100,
    estimated_time_saved: '68%',
    role_fit: ['operations', 'hr', 'people'],
  },
  {
    id: 'tpl-it-runbook',
    name: 'Incident Response Runbook',
    category: 'IT',
    description: 'Incident triage and remediation sequence with verification checkpoint.',
    workflow_steps: [
      { title: 'Classify incident severity', description: 'Assign priority and owner immediately.', action_type: 'analysis', order: 1 },
      { title: 'Execute remediation path', description: 'Apply approved mitigation steps.', action_type: 'action', order: 2 },
      { title: 'Verify recovery and log', description: 'Validate systems and capture learnings.', action_type: 'verification', order: 3 },
    ],
    usage_count: 18720,
    estimated_time_saved: '52%',
    role_fit: ['it', 'engineering', 'devops'],
  },
  {
    id: 'tpl-finance-invoice',
    name: 'Invoice Approval Workflow',
    category: 'Finance',
    description: 'Automated AP flow for policy checks, approval routing, and payment handoff.',
    workflow_steps: [
      { title: 'Extract invoice details', description: 'Capture vendor, amount, and due date.', action_type: 'data-entry', order: 1 },
      { title: 'Apply policy routing', description: 'Route by amount and category controls.', action_type: 'approval', order: 2 },
      { title: 'Finalize posting', description: 'Post approved invoice to ERP queue.', action_type: 'verification', order: 3 },
    ],
    usage_count: 14300,
    estimated_time_saved: '47%',
    role_fit: ['finance', 'accounting', 'operations'],
  },
  {
    id: 'tpl-hr-training',
    name: 'Team Training Program',
    category: 'HR',
    description: 'Learning workflow with objectives, checkpoints, and completion criteria.',
    workflow_steps: [
      { title: 'Define learning objectives', description: 'Set target outcomes per role.', action_type: 'planning', order: 1 },
      { title: 'Deliver guided modules', description: 'Assign training path and checkpoints.', action_type: 'training', order: 2 },
      { title: 'Assess completion', description: 'Review performance and certify completion.', action_type: 'review', order: 3 },
    ],
    usage_count: 10980,
    estimated_time_saved: '44%',
    role_fit: ['hr', 'people', 'operations'],
  },
  {
    id: 'tpl-sales-demo',
    name: 'Sales Demo Playbook',
    category: 'Sales',
    description: 'Repeatable demo sequence with qualification and follow-up automation.',
    workflow_steps: [
      { title: 'Prepare account context', description: 'Map pains, goals, and stakeholders.', action_type: 'planning', order: 1 },
      { title: 'Run guided product walkthrough', description: 'Follow structured demo storyline.', action_type: 'demo', order: 2 },
      { title: 'Execute next-step follow-up', description: 'Send recap and action plan.', action_type: 'communication', order: 3 },
    ],
    usage_count: 13240,
    estimated_time_saved: '39%',
    role_fit: ['sales', 'customer-success', 'operations'],
  },
];

const SECURITY_DOCS = [
  {
    id: 'sec-data-protection',
    title: 'Data Protection Architecture',
    category: 'Data protection',
    content: 'Avantika Flow AI encrypts data in transit and at rest, separates tenant workloads, and applies strict retention controls for workflow artifacts.',
    compliance_type: 'GDPR',
  },
  {
    id: 'sec-access-control',
    title: 'Access Control and Identity',
    category: 'Access control',
    content: 'Role-based access control, SSO-compatible authentication paths, and session management guard workflow access across teams.',
    compliance_type: 'SOC2',
  },
  {
    id: 'sec-compliance',
    title: 'Compliance Program Overview',
    category: 'Compliance',
    content: 'Security controls map to compliance frameworks including GDPR readiness, SOC2 control alignment, and ISO process standards.',
    compliance_type: 'ISO27001',
  },
  {
    id: 'sec-audit-monitoring',
    title: 'Audit Logs and Monitoring',
    category: 'Audit logs & monitoring',
    content: 'Workflow activity logs, guide modifications, and publication events are recorded for traceability and governance reporting.',
    compliance_type: 'SOC2',
  },
];

const ARTICLES = [
  {
    id: 'art-templates-2025',
    title: '10 workflow templates your team needs in 2025',
    type: 'guide',
    category: 'Guide',
    read_time: '8 min',
    summary: 'A practical list of high-impact templates to accelerate operations and reduce process bottlenecks.',
    content: 'This guide covers onboarding, incident response, invoice approvals, training programs, and sales demo templates. Each template includes outcomes, implementation tips, and adaptation patterns.',
    related_templates: ['tpl-ops-onboarding', 'tpl-it-runbook', 'tpl-finance-invoice'],
    role_fit: ['operations', 'it', 'finance'],
  },
  {
    id: 'art-security-checklist',
    title: 'Security checklist for workflow automation platforms',
    type: 'guide',
    category: 'Guide',
    read_time: '6 min',
    summary: 'A compliance-first checklist to evaluate encryption, identity, governance, and auditability.',
    content: 'Teams should verify data protection controls, RBAC coverage, session security, and continuous logging before scaling workflow automation.',
    related_templates: ['tpl-it-runbook'],
    role_fit: ['security', 'it', 'compliance'],
  },
  {
    id: 'art-optimization-update',
    title: 'Product update: AI optimization recommendations now continuous',
    type: 'update',
    category: 'Update',
    read_time: '4 min',
    summary: 'Learn how Optimize Agents now detect inefficiencies continuously and propose fixes automatically.',
    content: 'The latest release adds monitoring loops, recommendation confidence scoring, and guided apply-fix handoff into the builder.',
    related_templates: ['tpl-it-runbook', 'tpl-ops-onboarding'],
    role_fit: ['operations', 'it', 'leadership'],
  },
];

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

const templateRecommendations = (role) => {
  const normalized = String(role || '').toLowerCase();
  const matches = TEMPLATES.filter((t) => t.role_fit.some((r) => normalized.includes(r))).map((t) => t.id);
  return matches.length ? matches.slice(0, 3) : TEMPLATES.slice(0, 3).map((t) => t.id);
};

const articleRecommendations = (role) => {
  const normalized = String(role || '').toLowerCase();
  const matches = ARTICLES.filter((a) => a.role_fit.some((r) => normalized.includes(r))).map((a) => a.id);
  return matches.length ? matches.slice(0, 3) : ARTICLES.slice(0, 2).map((a) => a.id);
};

router.get('/templates', (req, res) => {
  const schema = Joi.object({
    category: Joi.string().allow('').max(40).default(''),
    query: Joi.string().allow('').max(100).default(''),
    role: Joi.string().allow('').max(80).default(''),
  });
  const { error, value } = schema.validate(req.query, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid template query' });

  let items = [...TEMPLATES];
  if (value.category) items = items.filter((t) => t.category.toLowerCase() === value.category.toLowerCase());
  if (value.query) {
    const q = value.query.toLowerCase();
    items = items.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }

  return res.json({
    success: true,
    templates: items,
    recommendedTemplateIds: templateRecommendations(value.role),
  });
});

router.get('/templates/:id', (req, res) => {
  const template = TEMPLATES.find((t) => t.id === req.params.id);
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
  return res.json({ success: true, template });
});

router.post('/templates/:id/customize', requireAuth, (req, res) => {
  const schema = Joi.object({
    companyContext: Joi.string().trim().min(2).max(500).required(),
  });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Company context is required' });

  const template = TEMPLATES.find((t) => t.id === req.params.id);
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

  const steps = template.workflow_steps.map((s, i) => ({
    ...s,
    description: `${s.description} Context adaptation: ${value.companyContext}.`,
    order: i + 1,
  }));

  return res.json({
    success: true,
    title: `${template.name} (Customized)`,
    steps,
    aiInsights: [
      'Customized workflow for company context',
      'Adjusted step language for team-specific implementation',
      'Added improvement suggestions for execution quality',
    ],
  });
});

router.post('/templates/:id/improve', (req, res) => {
  const template = TEMPLATES.find((t) => t.id === req.params.id);
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

  return res.json({
    success: true,
    suggestions: [
      'Add explicit ownership per step to reduce handoff ambiguity',
      'Include verification checkpoint before final completion',
      'Attach SLA or expected completion time for each stage',
    ],
  });
});

router.get('/security/docs', (req, res) => {
  const schema = Joi.object({ category: Joi.string().allow('').max(80).default('') });
  const { error, value } = schema.validate(req.query, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid security query' });

  const docs = value.category
    ? SECURITY_DOCS.filter((d) => d.category.toLowerCase() === value.category.toLowerCase())
    : SECURITY_DOCS;

  return res.json({ success: true, docs });
});

router.get('/security/docs/:id', (req, res) => {
  const doc = SECURITY_DOCS.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Security document not found' });
  return res.json({ success: true, doc });
});

router.post('/security/ask', (req, res) => {
  const schema = Joi.object({ query: Joi.string().trim().min(2).max(500).required() });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Security query is required' });

  return res.json({
    success: true,
    answer: `Security assistant: ${value.query}. Avantika Flow AI enforces encryption, RBAC controls, and auditability with compliance-aligned practices across workflow operations.`,
    relatedDocs: SECURITY_DOCS.slice(0, 2).map((d) => ({ id: d.id, title: d.title })),
  });
});

router.post('/security/docs/:id/summarize', (req, res) => {
  const doc = SECURITY_DOCS.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Security document not found' });

  return res.json({
    success: true,
    summary: `${doc.title}: ${doc.content}`,
    keyPoints: [
      'Enterprise-grade controls are documented and transparent',
      'Compliance mapping supports regulated operations',
      'Monitoring and audit trails improve governance readiness',
    ],
  });
});

router.post('/security/audit-report', requireAuth, (req, res) => {
  const schema = Joi.object({ scope: Joi.string().allow('').max(200).default('All workflows') });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid audit request' });

  return res.json({
    success: true,
    reportTitle: `Security Audit Report - ${value.scope}`,
    findings: [
      'Encryption controls configured for data at rest and in transit',
      'Role-based access policies active across workflow modules',
      'Audit logs retained for guide edits, publishing, and sharing events',
    ],
    compliance: ['GDPR-ready', 'SOC2-aligned', 'ISO process controls'],
  });
});

router.get('/guides', (req, res) => {
  const schema = Joi.object({
    type: Joi.string().allow('').max(20).default(''),
    query: Joi.string().allow('').max(100).default(''),
    role: Joi.string().allow('').max(80).default(''),
  });
  const { error, value } = schema.validate(req.query, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid guides query' });

  let articles = [...ARTICLES];
  if (value.type) articles = articles.filter((a) => a.type.toLowerCase() === value.type.toLowerCase());
  if (value.query) {
    const q = value.query.toLowerCase();
    articles = articles.filter((a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
  }

  return res.json({
    success: true,
    articles,
    recommendedArticleIds: articleRecommendations(value.role),
  });
});

router.get('/guides/:id', (req, res) => {
  const article = ARTICLES.find((a) => a.id === req.params.id);
  if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
  return res.json({ success: true, article });
});

router.post('/guides/:id/summarize', (req, res) => {
  const article = ARTICLES.find((a) => a.id === req.params.id);
  if (!article) return res.status(404).json({ success: false, message: 'Article not found' });

  return res.json({
    success: true,
    summary: `${article.title}: ${article.summary}`,
    keyPoints: [
      'Practical, workflow-first guidance',
      'Includes direct template-to-execution path',
      'Designed for rapid team adoption',
    ],
  });
});

router.post('/guides/:id/to-workflow', (req, res) => {
  const article = ARTICLES.find((a) => a.id === req.params.id);
  if (!article) return res.status(404).json({ success: false, message: 'Article not found' });

  const related = article.related_templates
    .map((id) => TEMPLATES.find((t) => t.id === id))
    .filter(Boolean);

  const steps = (related[0]?.workflow_steps || [
    { title: 'Define workflow objective', description: 'Translate article insight into an actionable process objective.', action_type: 'planning', order: 1 },
    { title: 'Execute recommended sequence', description: 'Apply the core pattern described in the article.', action_type: 'action', order: 2 },
    { title: 'Measure and optimize', description: 'Track outcomes and iterate based on results.', action_type: 'review', order: 3 },
  ]).map((s, i) => ({ ...s, order: i + 1 }));

  return res.json({
    success: true,
    title: `${article.title} Workflow`,
    steps,
    aiInsights: [
      'Converted article into executable workflow steps',
      'Attached template-backed structure for faster adoption',
      'Prepared output for immediate SOP Builder editing',
    ],
  });
});

module.exports = router;
