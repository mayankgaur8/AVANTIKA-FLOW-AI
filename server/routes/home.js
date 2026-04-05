const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const { usersById } = require('../db/store');

const router = express.Router();

const workflowIntents = [
  { id: 'onboard-new-hires', name: 'Onboard new hires', category: 'HR', default_template: 'Employee Onboarding Workflow' },
  { id: 'create-sops', name: 'Create SOPs', category: 'Operations', default_template: 'Standard Operating Procedure Template' },
  { id: 'build-training-docs', name: 'Build training docs', category: 'HR', default_template: 'Training Program Template' },
  { id: 'implement-software', name: 'Implement software', category: 'IT', default_template: 'Software Rollout Playbook' },
  { id: 'assist-customers', name: 'Assist customers', category: 'Customer', default_template: 'Support Response Playbook' },
  { id: 'something-else', name: 'Something else', category: 'Custom', default_template: 'Custom Workflow Generator' },
];

const userSelectionsByUser = new Map();

const getOptionalUser = (req) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'dev-secret');
    return usersById.get(decoded.sub) || null;
  } catch {
    return null;
  }
};

const roleRecommendation = (role) => {
  const normalized = String(role || '').toLowerCase();
  if (normalized.includes('hr') || normalized.includes('people')) return 'onboard-new-hires';
  if (normalized.includes('it') || normalized.includes('dev') || normalized.includes('engineer')) return 'implement-software';
  if (normalized.includes('ops') || normalized.includes('operation')) return 'create-sops';
  if (normalized.includes('sales') || normalized.includes('customer') || normalized.includes('support')) return 'assist-customers';
  return 'create-sops';
};

const defaultPayloadByIntent = {
  'onboard-new-hires': { role: 'New hire', tools: 'Google Workspace, Slack', teamSize: '50' },
  'create-sops': { processName: 'Monthly reporting process', inputMode: 'ai-generated' },
  'build-training-docs': { topic: 'Security onboarding', tool: 'LMS' },
  'implement-software': { toolName: 'Jira', rolloutScope: 'Product + Engineering' },
  'assist-customers': { supportType: 'helpdesk', channel: 'chat+email' },
  'something-else': { customGoal: 'Automate internal approvals with clear SOP checkpoints' },
};

const getKey = (userId) => (userId ? String(userId) : 'anonymous');

const recordSelection = ({ userId, selectedIntent, context }) => {
  const key = getKey(userId);
  const row = {
    user_id: key,
    selected_intent: selectedIntent,
    timestamp: new Date().toISOString(),
    context: context || {},
  };
  const existing = userSelectionsByUser.get(key) || [];
  userSelectionsByUser.set(key, [row, ...existing].slice(0, 15));
  return row;
};

const latestSelection = (userId) => {
  const key = getKey(userId);
  const list = userSelectionsByUser.get(key) || [];
  return list[0] || null;
};

const generateByIntent = ({ intentId, payload }) => {
  const p = payload || {};

  if (intentId === 'onboard-new-hires') {
    const title = `Onboarding Plan - ${p.role || 'New Hire'}`;
    return {
      title,
      description: `Onboarding workflow for team size ${p.teamSize || 'N/A'} using ${p.tools || 'core tools'}.`,
      steps: [
        { title: 'Collect preboarding data', description: 'Gather role profile, manager details, and required tools.', action_type: 'planning', order: 1 },
        { title: 'Provision accounts and tools', description: `Set up ${p.tools || 'required systems'} access and permissions.`, action_type: 'setup', order: 2 },
        { title: 'Run day-one onboarding checklist', description: 'Complete orientation, policy walkthrough, and role expectations.', action_type: 'training', order: 3 },
        { title: 'Track week-one milestones', description: 'Review progress, close blockers, and confirm readiness.', action_type: 'monitoring', order: 4 },
      ],
      aiInsights: ['Generated onboarding checklist from role and tool context', 'Added role-based milestone checkpoints'],
    };
  }

  if (intentId === 'create-sops') {
    const process = p.processName || 'Business Process';
    return {
      title: `${process} SOP`,
      description: `Structured SOP generated from ${p.inputMode || 'guided'} capture mode.`,
      steps: [
        { title: 'Define process objective', description: `Document purpose and expected output for ${process}.`, action_type: 'planning', order: 1 },
        { title: 'Capture or draft process steps', description: 'Collect steps manually or use AI generated sequence.', action_type: 'documentation', order: 2 },
        { title: 'Standardize ownership and checkpoints', description: 'Assign owners and verification criteria for each step.', action_type: 'standardization', order: 3 },
        { title: 'Publish SOP version', description: 'Finalize and publish for team reuse.', action_type: 'review', order: 4 },
      ],
      aiInsights: ['Standardized process with validation checkpoints', 'Prepared for save, publish, and reuse'],
    };
  }

  if (intentId === 'build-training-docs') {
    const topic = p.topic || 'Training Topic';
    return {
      title: `${topic} Training Guide`,
      description: `Training modules for ${topic} using ${p.tool || 'internal tools'}.`,
      steps: [
        { title: 'Define learning objectives', description: 'Set measurable outcomes by role and skill level.', action_type: 'planning', order: 1 },
        { title: 'Build training modules', description: `Generate structured modules for ${topic}.`, action_type: 'training', order: 2 },
        { title: 'Add examples and quizzes', description: 'Insert practical examples and knowledge checks.', action_type: 'training', order: 3 },
        { title: 'Publish training workflow', description: 'Assign audience and activate tracking.', action_type: 'monitoring', order: 4 },
      ],
      aiInsights: ['Generated training modules with quiz checkpoints', 'Added guidance for faster learner activation'],
    };
  }

  if (intentId === 'implement-software') {
    const tool = p.toolName || 'Software Tool';
    return {
      title: `${tool} Implementation Playbook`,
      description: `Rollout guide for ${tool} across ${p.rolloutScope || 'target teams'}.`,
      steps: [
        { title: 'Define rollout scope', description: `Identify impacted teams and use-cases for ${tool}.`, action_type: 'planning', order: 1 },
        { title: 'Configure baseline setup', description: 'Apply core settings, permissions, and integrations.', action_type: 'setup', order: 2 },
        { title: 'Pilot with initial team', description: 'Run pilot workflow and collect implementation feedback.', action_type: 'action', order: 3 },
        { title: 'Scale and monitor adoption', description: 'Roll out organization-wide and monitor usage KPIs.', action_type: 'monitoring', order: 4 },
      ],
      aiInsights: ['Generated staged software rollout strategy', 'Included adoption and governance checkpoints'],
    };
  }

  if (intentId === 'assist-customers') {
    return {
      title: 'Customer Support Playbook',
      description: `Support SOP for ${p.supportType || 'support'} via ${p.channel || 'multi-channel'} operations.`,
      steps: [
        { title: 'Classify incoming request', description: 'Tag intent, severity, and customer segment.', action_type: 'analysis', order: 1 },
        { title: 'Apply response template', description: 'Use context-aware scripts for consistent responses.', action_type: 'communication', order: 2 },
        { title: 'Execute resolution workflow', description: 'Run step-by-step playbook and diagnostics.', action_type: 'action', order: 3 },
        { title: 'Close and log reusable knowledge', description: 'Document resolution and update support SOP.', action_type: 'documentation', order: 4 },
      ],
      aiInsights: ['Generated support scripts and playbook structure', 'Added repeatability and quality controls'],
    };
  }

  const customGoal = p.customGoal || 'Custom workflow objective';
  return {
    title: 'Custom AI Workflow',
    description: customGoal,
    steps: [
      { title: 'Clarify target outcome', description: `Define success criteria for: ${customGoal}.`, action_type: 'planning', order: 1 },
      { title: 'Draft process sequence', description: 'Generate and validate practical execution steps.', action_type: 'action', order: 2 },
      { title: 'Add verification and owners', description: 'Ensure accountability and quality checkpoints.', action_type: 'verification', order: 3 },
      { title: 'Publish reusable workflow', description: 'Finalize for team adoption and optimization.', action_type: 'review', order: 4 },
    ],
    aiInsights: ['Interpreted free-text intent into executable workflow', 'Suggested structure for rapid implementation'],
  };
};

router.get('/selector/bootstrap', (req, res) => {
  const optionalUser = getOptionalUser(req);
  const schema = Joi.object({
    role: Joi.string().allow('').max(120).default(''),
    userId: Joi.string().allow('').max(120).default(''),
  });
  const { error, value } = schema.validate(req.query, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid bootstrap query' });

  const role = value.role || optionalUser?.role || optionalUser?.selected_persona || '';
  const userId = optionalUser?.id || value.userId || null;
  const recommendedIntentId = roleRecommendation(role);
  const latest = latestSelection(userId);

  return res.json({
    success: true,
    intents: workflowIntents,
    recommendedIntentId,
    prefillByIntent: {
      ...defaultPayloadByIntent,
      ...(latest ? { [latest.selected_intent]: { ...defaultPayloadByIntent[latest.selected_intent], ...latest.context } } : {}),
    },
    instantTemplates: workflowIntents.map((i) => ({ intentId: i.id, template: i.default_template })),
    roleDetected: role || null,
  });
});

router.post('/selector/select', (req, res) => {
  const optionalUser = getOptionalUser(req);
  const schema = Joi.object({
    userId: Joi.string().allow('').max(120).default(''),
    selectedIntent: Joi.string().valid(...workflowIntents.map((i) => i.id)).required(),
    context: Joi.object().unknown(true).default({}),
  });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid selection payload' });

  const row = recordSelection({
    userId: optionalUser?.id || value.userId || null,
    selectedIntent: value.selectedIntent,
    context: value.context,
  });

  return res.status(201).json({ success: true, selection: row });
});

router.post('/selector/generate', (req, res) => {
  const schema = Joi.object({
    intentId: Joi.string().valid(...workflowIntents.map((i) => i.id)).required(),
    payload: Joi.object().unknown(true).default({}),
  });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid generation payload' });

  const generated = generateByIntent({ intentId: value.intentId, payload: value.payload });
  return res.json({ success: true, intentId: value.intentId, ...generated });
});

router.post('/selector/suggest', (req, res) => {
  const schema = Joi.object({
    text: Joi.string().trim().min(4).max(1200).required(),
  });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Please enter more detail for AI suggestion' });

  const lower = value.text.toLowerCase();
  let intentId = 'something-else';
  if (lower.includes('onboard') || lower.includes('hire')) intentId = 'onboard-new-hires';
  else if (lower.includes('sop') || lower.includes('process')) intentId = 'create-sops';
  else if (lower.includes('training') || lower.includes('learn')) intentId = 'build-training-docs';
  else if (lower.includes('implement') || lower.includes('jira') || lower.includes('sap') || lower.includes('crm')) intentId = 'implement-software';
  else if (lower.includes('support') || lower.includes('customer') || lower.includes('helpdesk')) intentId = 'assist-customers';

  const generated = generateByIntent({ intentId, payload: { customGoal: value.text, processName: value.text, topic: value.text, toolName: value.text } });

  return res.json({
    success: true,
    suggestedIntentId: intentId,
    ...generated,
    aiInsights: [
      ...(generated.aiInsights || []),
      'Mapped free-text goal to the most relevant workflow intent',
    ],
  });
});

module.exports = router;
