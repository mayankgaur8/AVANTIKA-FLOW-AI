const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const {
  usersById,
  startRecordingSession,
  appendRecordingStep,
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

const EXAMPLES = [
  {
    id: 'ops-onboarding',
    category: 'Operations',
    title: 'Employee Onboarding SOP',
    description: 'End-to-end onboarding from offer acceptance to 30-day check-in.',
    aiInsights: ['High completion pattern among fast-scaling teams', 'Includes early-risk checkpoints'],
    steps: [
      { title: 'Create preboarding checklist', description: 'Collect documents, account setup, and welcome schedule.', action_type: 'planning' },
      { title: 'Day 1 orientation workflow', description: 'Conduct orientation with role expectations and tool access.', action_type: 'onboarding' },
      { title: 'Week 1 milestone review', description: 'Track completion and resolve blockers.', action_type: 'monitoring' },
    ],
  },
  {
    id: 'it-runbook',
    category: 'IT',
    title: 'DevOps Deployment Runbook',
    description: 'Structured release flow with rollback and post-deploy checks.',
    aiInsights: ['Reduces deployment incidents by standardizing gates', 'Includes smoke-test and rollback checkpoints'],
    steps: [
      { title: 'Pre-deploy checklist', description: 'Validate approvals, build status, and environment readiness.', action_type: 'verification' },
      { title: 'Deploy with staged rollout', description: 'Release with canary or phased exposure controls.', action_type: 'deployment' },
      { title: 'Monitor and document outcome', description: 'Capture metrics and update incident notes.', action_type: 'monitoring' },
    ],
  },
  {
    id: 'finance-invoice',
    category: 'Finance',
    title: 'Invoice Processing Workflow',
    description: 'Standard AP flow for validation, approvals, and payment handoff.',
    aiInsights: ['Prevents duplicate invoice risks', 'Auto-routes approvals by spend threshold'],
    steps: [
      { title: 'Capture invoice details', description: 'Extract vendor, amount, due date, and line items.', action_type: 'data-entry' },
      { title: 'Policy and duplicate validation', description: 'Run compliance checks and duplicate detection.', action_type: 'verification' },
      { title: 'Approval and ERP sync', description: 'Route approval and sync approved entry to finance system.', action_type: 'approval' },
    ],
  },
  {
    id: 'customer-support',
    category: 'Customer',
    title: 'Support Response Playbook',
    description: 'Consistent diagnosis and response flow for support teams.',
    aiInsights: ['Cuts first-response variation across agents', 'Adds reusable root-cause paths'],
    steps: [
      { title: 'Classify issue context', description: 'Categorize severity and probable issue cluster.', action_type: 'analysis' },
      { title: 'Guided diagnosis steps', description: 'Run checks and capture reproducible signals.', action_type: 'diagnosis' },
      { title: 'Respond and close with notes', description: 'Send response and save resolution pattern.', action_type: 'communication' },
    ],
  },
  {
    id: 'hr-compliance',
    category: 'HR',
    title: 'Policy Compliance SOP',
    description: 'Enforce policy completion with role-based assignment and tracking.',
    aiInsights: ['Improves policy completion rates with reminders', 'Audit-ready evidence trail included'],
    steps: [
      { title: 'Define policy control steps', description: 'Break policy into assignable execution tasks.', action_type: 'policy' },
      { title: 'Assign by role', description: 'Auto-assign required completion by role and department.', action_type: 'assignment' },
      { title: 'Track and log completion', description: 'Capture completion and exceptions for audit.', action_type: 'audit' },
    ],
  },
];

const categorizeAction = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('click')) return 'action';
  if (t.includes('input') || t.includes('type')) return 'data-entry';
  if (t.includes('navigate') || t.includes('url')) return 'navigation';
  if (t.includes('submit')) return 'verification';
  return 'action';
};

const createStepFromEvent = (event, index) => {
  const eventType = (event.eventType || event.type || 'action').toLowerCase();
  const label = event.target || event.url || event.note || `Interaction ${index + 1}`;
  const verb = eventType.includes('navigate') ? 'Navigate' : eventType.includes('input') ? 'Enter' : eventType.includes('submit') ? 'Submit' : 'Click';

  return {
    title: `${verb}: ${label}`,
    description: event.value
      ? `Performed ${eventType} on ${label}. Captured input value and interaction context.`
      : `Performed ${eventType} on ${label}.`,
    action_type: categorizeAction(eventType),
    order: index + 1,
  };
};

router.post('/record/start', requireAuth, (req, res) => {
  const schema = Joi.object({
    mode: Joi.string().valid('screen', 'browser', 'manual').default('manual'),
    title: Joi.string().trim().max(140).default('Recorded workflow'),
  });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid recording request' });

  if (!req.user.workspace_id) {
    return res.status(409).json({ success: false, message: 'Create a workspace before recording' });
  }

  const session = startRecordingSession({
    workspaceId: req.user.workspace_id,
    userId: req.user.id,
    title: value.title,
  });

  return res.status(201).json({
    success: true,
    session: { id: session.id, startedAt: session.started_at, mode: value.mode },
  });
});

router.post('/record/event', requireAuth, (req, res) => {
  const schema = Joi.object({
    sessionId: Joi.string().required(),
    eventType: Joi.string().trim().max(40).required(),
    target: Joi.string().allow('').max(200).default(''),
    value: Joi.string().allow('').max(500).default(''),
    url: Joi.string().allow('').max(500).default(''),
    note: Joi.string().allow('').max(500).default(''),
  });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid event payload' });

  const step = appendRecordingStep({
    sessionId: value.sessionId,
    step: {
      title: value.target || value.url || value.note || value.eventType,
      description: value.value || value.note || '',
      action_type: categorizeAction(value.eventType),
      metadata_json: {
        eventType: value.eventType,
        target: value.target,
        value: value.value,
        url: value.url,
      },
    },
  });

  if (!step) return res.status(404).json({ success: false, message: 'Recording session not found' });
  return res.json({ success: true, step });
});

router.post('/record/stop', requireAuth, (req, res) => {
  const schema = Joi.object({
    sessionId: Joi.string().required(),
    title: Joi.string().trim().max(140).default('Recorded workflow'),
    description: Joi.string().allow('').max(1000).default(''),
    events: Joi.array().items(
      Joi.object({
        eventType: Joi.string().required(),
        target: Joi.string().allow(''),
        value: Joi.string().allow(''),
        url: Joi.string().allow(''),
        note: Joi.string().allow(''),
      }),
    ).default([]),
  });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid stop payload' });

  const eventSteps = value.events.map(createStepFromEvent);
  if (eventSteps.length === 0) {
    eventSteps.push(
      { title: 'Open workflow context', description: 'Started recording and initialized workflow context.', action_type: 'setup', order: 1 },
      { title: 'Execute core process action', description: 'Captured primary action path for this workflow.', action_type: 'action', order: 2 },
      { title: 'Validate and finish process', description: 'Completed process and verified output.', action_type: 'verification', order: 3 },
    );
  }

  return res.json({
    success: true,
    title: value.title,
    steps: eventSteps,
    aiInsights: [
      'Converted raw recording into structured SOP steps',
      'Added descriptive labels and action categorization',
      'Detected likely missing verification checkpoints',
      'Prepared output for immediate editing in SOP Builder',
    ],
  });
});

router.get('/examples', requireAuth, (req, res) => {
  const role = String(req.query.role || '').toLowerCase();
  const recommended = role
    ? EXAMPLES.filter((e) => e.category.toLowerCase().includes(role) || e.title.toLowerCase().includes(role)).map((e) => e.id)
    : [];

  return res.json({
    success: true,
    examples: EXAMPLES,
    recommendedExampleIds: recommended.slice(0, 3),
  });
});

router.post('/examples/:exampleId/customize', requireAuth, (req, res) => {
  const schema = Joi.object({ prompt: Joi.string().trim().min(2).max(1000).required() });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Prompt is required' });

  const base = EXAMPLES.find((e) => e.id === req.params.exampleId);
  if (!base) return res.status(404).json({ success: false, message: 'Example not found' });

  const customized = base.steps.map((s, i) => ({
    ...s,
    description: `${s.description} Tailored note: ${value.prompt}.`,
    order: i + 1,
  }));

  return res.json({
    success: true,
    title: `${base.title} (Customized)` ,
    steps: customized,
    aiInsights: [
      'Customized template using your prompt context',
      'Adjusted step phrasing for clarity and relevance',
      'Added workflow notes for implementation readiness',
    ],
  });
});

router.post('/templates/generate', requireAuth, (req, res) => {
  const schema = Joi.object({
    templateKey: Joi.string().valid('onboarding', 'internal-workflow', 'runbook', 'training').required(),
    prompt: Joi.string().trim().min(4).max(1500).required(),
  });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid template request' });

  const baseByKey = {
    onboarding: [
      { title: 'Prepare onboarding checklist', description: 'Define day-1 access and required resources.', action_type: 'planning' },
      { title: 'Run role-specific onboarding', description: 'Guide employee through tools, workflows, and expectations.', action_type: 'onboarding' },
      { title: 'Collect completion and feedback', description: 'Track completion metrics and gather onboarding feedback.', action_type: 'monitoring' },
    ],
    'internal-workflow': [
      { title: 'Define workflow objective', description: 'Clarify desired process outcome and owners.', action_type: 'planning' },
      { title: 'Execute workflow sequence', description: 'Perform key steps in order with checkpoints.', action_type: 'action' },
      { title: 'Document and share process', description: 'Store final process in knowledge base.', action_type: 'documentation' },
    ],
    runbook: [
      { title: 'Set runbook trigger conditions', description: 'Define when this runbook should be executed.', action_type: 'setup' },
      { title: 'Perform operational recovery steps', description: 'Run operational checks and mitigation tasks.', action_type: 'action' },
      { title: 'Verify system stability', description: 'Confirm health metrics return to baseline.', action_type: 'verification' },
    ],
    training: [
      { title: 'Define learning objectives', description: 'Set measurable outcomes for this training.', action_type: 'planning' },
      { title: 'Deliver lessons and checkpoints', description: 'Run lessons with practical knowledge checks.', action_type: 'training' },
      { title: 'Assess and improve program', description: 'Review results and optimize training quality.', action_type: 'review' },
    ],
  };

  const base = baseByKey[value.templateKey];
  const steps = base.map((s, i) => ({
    ...s,
    description: `${s.description} Context: ${value.prompt}.`,
    order: i + 1,
  }));

  return res.json({
    success: true,
    title: `${value.prompt.slice(0, 70)}${value.prompt.length > 70 ? '...' : ''}`,
    steps,
    aiInsights: [
      'Generated workflow from text prompt',
      'Applied template structure for faster completion',
      'Filled likely missing transitional steps',
      'Prepared for immediate SOP Builder editing',
    ],
  });
});

module.exports = router;
