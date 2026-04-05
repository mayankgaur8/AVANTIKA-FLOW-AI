/**
 * /api/hr/* — HR & L&D Workflow Builders
 *
 * hrType 'onboarding'  → /hr/onboarding-guides
 * hrType 'training'    → /hr/training-programs
 * hrType 'knowledge'   → /hr/knowledge-base
 * hrType 'compliance'  → /hr/compliance-sops
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
  engineer: [
    { title: 'Pre-day-1 access setup', description: 'Provision email, SSO, Slack, code repository, issue tracker, and required tooling before first day.', action_type: 'setup' },
    { title: 'Day 1 orientation and introductions', description: 'Run onboarding orientation, team introductions, and role expectations alignment.', action_type: 'onboarding' },
    { title: 'Development environment setup', description: 'Guide setup for local dev environment, project dependencies, and branch conventions.', action_type: 'setup' },
    { title: 'Week 1 delivery goals', description: 'Define first-week milestones and assign an onboarding buddy for daily check-ins.', action_type: 'planning' },
    { title: '30-60-90 day roadmap', description: 'Create learning and delivery roadmap with measurable outcomes and manager reviews.', action_type: 'milestone' },
    { title: 'Progress review and feedback', description: 'Track completion, identify bottlenecks, and collect onboarding feedback from new hire.', action_type: 'monitoring' },
  ],
  hr: [
    { title: 'HR systems and policy access', description: 'Grant access to HRIS, policy repository, payroll platform, and employee lifecycle tools.', action_type: 'setup' },
    { title: 'Compliance orientation', description: 'Complete required HR compliance modules including privacy and workplace policies.', action_type: 'compliance' },
    { title: 'Role-specific process walkthrough', description: 'Review onboarding/offboarding, leave management, and performance management workflows.', action_type: 'training' },
    { title: 'Week 1 stakeholder mapping', description: 'Identify key business partners across finance, legal, and operations.', action_type: 'planning' },
    { title: '30-60-90 operational milestones', description: 'Set milestones tied to HR service-level outcomes and employee experience metrics.', action_type: 'milestone' },
    { title: 'Onboarding completion and pulse survey', description: 'Capture completion status and quality feedback to improve future onboarding flows.', action_type: 'monitoring' },
  ],
  sales: [
    { title: 'Sales systems provisioning', description: 'Set up CRM, sales engagement tools, enablement portal, and communication channels.', action_type: 'setup' },
    { title: 'Product and ICP training', description: 'Complete foundational product training and ideal customer profile orientation.', action_type: 'training' },
    { title: 'Script and playbook onboarding', description: 'Review core scripts, objection handling, and qualification framework.', action_type: 'training' },
    { title: 'Week 1 activity targets', description: 'Define call/email activity targets with manager and onboarding mentor.', action_type: 'planning' },
    { title: '30-60-90 quota readiness plan', description: 'Create milestone plan for pipeline creation, conversion rates, and quota progression.', action_type: 'milestone' },
    { title: 'Performance and readiness check', description: 'Assess onboarding completion and readiness for independent execution.', action_type: 'monitoring' },
  ],
  department: [
    { title: 'Department-specific systems setup', description: 'Provision all systems required for this department and verify permissions.', action_type: 'setup' },
    { title: 'Role and workflow orientation', description: 'Introduce team workflows, decision rights, and expected outcomes for the role.', action_type: 'onboarding' },
    { title: 'Day 1 and Week 1 checklist', description: 'Run structured checklist covering essentials for productivity and alignment.', action_type: 'planning' },
    { title: 'Mentor and manager assignment', description: 'Assign onboarding owner and define check-in cadence.', action_type: 'assignment' },
    { title: '30-60-90 day plan', description: 'Set staged milestones and skills goals with measurable checkpoints.', action_type: 'milestone' },
    { title: 'Completion tracking and feedback', description: 'Track completion percentage and gather new-hire feedback to close gaps.', action_type: 'monitoring' },
  ],
};

const TRAINING_STEPS = {
  skill: [
    { title: 'Define skill objectives and outcomes', description: 'Set clear learning objectives and measurable success criteria for the module.', action_type: 'planning' },
    { title: 'Create lesson sequence', description: 'Build modular lesson flow from fundamentals to advanced application.', action_type: 'content' },
    { title: 'Attach media and practice resources', description: 'Add videos, docs, exercises, and role-relevant examples to each lesson.', action_type: 'content' },
    { title: 'AI concept gap enhancement', description: 'Detect missing concepts and inject prerequisite context for better completion.', action_type: 'analysis' },
    { title: 'Generate quizzes and checkpoints', description: 'Auto-generate assessment questions at module checkpoints.', action_type: 'assessment' },
    { title: 'Assign by role and skill gap', description: 'Assign module to teams based on role and observed performance gaps.', action_type: 'assignment' },
    { title: 'Track completion and scores', description: 'Monitor completion rates, quiz performance, and engagement trends.', action_type: 'monitoring' },
  ],
  role: [
    { title: 'Role capability mapping', description: 'Map required competencies for target role and level.', action_type: 'planning' },
    { title: 'Build role-based learning path', description: 'Design module path aligned with day-to-day responsibilities.', action_type: 'content' },
    { title: 'Add practical scenarios', description: 'Include realistic role scenarios and simulation exercises.', action_type: 'content' },
    { title: 'AI simplification and clarity pass', description: 'Simplify complex language and improve readability across lessons.', action_type: 'analysis' },
    { title: 'Assessment and proficiency gate', description: 'Create graded checkpoints and proficiency thresholds.', action_type: 'assessment' },
    { title: 'Assign to role cohorts', description: 'Publish and assign learning path to role cohorts across teams.', action_type: 'assignment' },
    { title: 'Review learning impact', description: 'Measure performance improvements after module completion.', action_type: 'monitoring' },
  ],
};

const KNOWLEDGE_STEPS = {
  sop: [
    { title: 'Ingest source SOP/workflow', description: 'Import SOPs, guides, or recorded workflows into knowledge article draft.', action_type: 'capture' },
    { title: 'Structure into categories and tags', description: 'Organize by domain, owner, function, and lifecycle stage.', action_type: 'organization' },
    { title: 'AI summarize and standardize', description: 'Generate concise summaries and normalize terminology for consistency.', action_type: 'analysis' },
    { title: 'Improve readability and formatting', description: 'Refine structure with headings, key points, and actionable steps.', action_type: 'editing' },
    { title: 'Enable discoverability metadata', description: 'Attach search keywords, related articles, and context links.', action_type: 'search' },
    { title: 'Version and ownership controls', description: 'Assign owner, version rules, and archive policy for outdated content.', action_type: 'governance' },
  ],
  documents: [
    { title: 'Upload documents and source files', description: 'Capture docs from shared drives, wikis, and handbooks.', action_type: 'capture' },
    { title: 'Categorize and map ownership', description: 'Tag by topic, team, and owner to ensure accountability.', action_type: 'organization' },
    { title: 'AI content cleanup', description: 'Remove duplication, standardize terms, and improve readability.', action_type: 'analysis' },
    { title: 'Create linked knowledge entries', description: 'Split large docs into searchable knowledge entries with cross-links.', action_type: 'editing' },
    { title: 'Search recommendations and gaps', description: 'Generate smart suggestions and detect missing knowledge areas.', action_type: 'search' },
    { title: 'Versioning and archive automation', description: 'Enable update cadence and archive stale entries automatically.', action_type: 'governance' },
  ],
};

const COMPLIANCE_STEPS = {
  policy: [
    { title: 'Define policy scope and applicability', description: 'Specify policy objective, affected roles, and departments.', action_type: 'policy' },
    { title: 'Break policy into executable steps', description: 'Convert policy text into step-by-step SOP actions.', action_type: 'structuring' },
    { title: 'AI gap and completeness validation', description: 'Detect ambiguous or missing controls and suggest improvements.', action_type: 'analysis' },
    { title: 'Assign by role and department', description: 'Auto-assign policy SOP to relevant employees and managers.', action_type: 'assignment' },
    { title: 'Set required completion and reminders', description: 'Configure deadlines, reminders, and escalation alerts.', action_type: 'enforcement' },
    { title: 'Monitor compliance and violations', description: 'Track completion rates, exceptions, and policy breach events.', action_type: 'monitoring' },
    { title: 'Generate audit-ready logs', description: 'Capture immutable audit trail for assignments, completion, and updates.', action_type: 'audit' },
  ],
  regulation: [
    { title: 'Map regulation to internal policy controls', description: 'Translate regulatory clauses into internal control requirements.', action_type: 'policy' },
    { title: 'Create compliance action checklist', description: 'Define required evidence, owner, and review cadence.', action_type: 'structuring' },
    { title: 'AI compliance gap detection', description: 'Highlight missing controls, weak wording, and enforcement gaps.', action_type: 'analysis' },
    { title: 'Assign controls to accountable owners', description: 'Route each control to role/department owners with due dates.', action_type: 'assignment' },
    { title: 'Enforce completion workflows', description: 'Set mandatory completion and automated reminders/escalations.', action_type: 'enforcement' },
    { title: 'Track adherence metrics', description: 'Monitor completion %, overdue controls, and exception trends.', action_type: 'monitoring' },
    { title: 'Export audit evidence package', description: 'Package compliance logs and evidence for audits.', action_type: 'audit' },
  ],
};

const normalizeSteps = (steps) => steps.map((s, i) => ({ ...s, step_number: i + 1 }));

router.post('/generate', requireAuth, (req, res) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(140).required(),
    description: Joi.string().trim().allow('').max(2500).default(''),
    hrType: Joi.string().valid('onboarding', 'training', 'knowledge', 'compliance').required(),
    onboardingTemplate: Joi.string().allow('').max(40).default(''),
    trainingType: Joi.string().allow('').max(40).default(''),
    knowledgeSource: Joi.string().allow('').max(40).default(''),
    complianceType: Joi.string().allow('').max(40).default(''),
    audience: Joi.string().allow('').max(80).default(''),
  });

  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  let steps = [];
  let aiInsights = [];

  if (value.hrType === 'onboarding') {
    const key = value.onboardingTemplate || 'department';
    steps = normalizeSteps(ONBOARDING_STEPS[key] || ONBOARDING_STEPS.department);
    aiInsights = [
      'Generated role-based onboarding journey',
      'Inserted Day 1, Week 1, and 30-60-90 milestone structure',
      'Added mentor/manager assignment checkpoints',
      value.audience ? `Personalized for audience: ${value.audience}` : 'Applied default onboarding audience profile',
    ];
  } else if (value.hrType === 'training') {
    const key = value.trainingType || 'role';
    steps = normalizeSteps(TRAINING_STEPS[key] || TRAINING_STEPS.role);
    aiInsights = [
      'Generated modular learning path with progression flow',
      'Added auto-quiz and assessment checkpoints',
      'Simplified complex training sections for readability',
      'Added role/team assignment and tracking hooks',
    ];
  } else if (value.hrType === 'knowledge') {
    const key = value.knowledgeSource || 'sop';
    steps = normalizeSteps(KNOWLEDGE_STEPS[key] || KNOWLEDGE_STEPS.sop);
    aiInsights = [
      'Generated structured knowledge article flow',
      'Applied terminology normalization and summary generation',
      'Added discoverability metadata for search',
      'Inserted ownership/version governance controls',
    ];
  } else {
    const key = value.complianceType || 'policy';
    steps = normalizeSteps(COMPLIANCE_STEPS[key] || COMPLIANCE_STEPS.policy);
    aiInsights = [
      'Generated policy-to-action compliance SOP',
      'Detected potential control and wording gaps',
      'Added assignment and escalation enforcement workflow',
      'Included audit-ready logging steps',
    ];
  }

  return res.json({ success: true, title: value.title, steps, aiInsights, hrType: value.hrType });
});

router.post('/create', requireAuth, (req, res) => {
  const stepSchema = Joi.object({
    title: Joi.string().trim().min(1).max(160).required(),
    description: Joi.string().allow('').max(2500).default(''),
    action_type: Joi.string().trim().max(80).default('action'),
    order: Joi.number().integer().min(1).optional(),
    role: Joi.string().allow('').max(80).default(''),
    tip: Joi.string().allow('').max(600).default(''),
    media_url: Joi.string().allow('').max(2048).default(''),
    quiz_question: Joi.string().allow('').max(500).default(''),
    compliance_note: Joi.string().allow('').max(800).default(''),
    required: Joi.boolean().default(false),
  });

  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(140).required(),
    description: Joi.string().allow('').max(2500).default(''),
    source: Joi.string().valid('onboarding', 'training', 'knowledge', 'compliance').required(),
    status: Joi.string().valid('draft', 'published').default('draft'),
    category: Joi.string().allow('').max(80).default(''),
    tags: Joi.array().items(Joi.string().max(40)).max(12).default([]),
    steps: Joi.array().items(stepSchema).min(1).max(80).required(),
  });

  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  if (!req.user.workspace_id) {
    return res.status(409).json({ success: false, message: 'Create a workspace before building HR workflows' });
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
          media_url: step.media_url,
          quiz_question: step.quiz_question,
          compliance_note: step.compliance_note,
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
      metadata: { title: value.title, source: value.source, action: 'hr_workflow_create' },
    });

    return res.status(201).json({ success: true, guide, steps });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Unable to save HR workflow' });
  }
});

module.exports = router;
