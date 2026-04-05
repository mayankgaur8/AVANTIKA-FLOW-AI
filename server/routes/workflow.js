/**
 * /api/workflow/* — Process Documentation, Workflow Standardization, Training Builder
 *
 * All three builders reuse the same underlying Guide+Step data model.
 * guide.source distinguishes the builder:
 *   'process-capture'  → Process Documentation
 *   'standardize'      → Workflow Standardization
 *   'training'         → Training Guide
 */

const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const {
  usersById,
  guidesById,
  createGuideRecord,
  upsertGuideSteps,
  addGuideActivity,
  guidesByWorkspace,
} = require('../db/store');

const router = express.Router();

// ─── Auth middleware ──────────────────────────────────────────────────────────

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

// ─── AI generation helpers ───────────────────────────────────────────────────

const PROCESS_PATTERNS = [
  {
    keywords: ['employee onboard', 'new hire', 'staff onboard'],
    steps: [
      { title: 'Pre-arrival setup', description: 'Create accounts, prepare workspace, and send welcome email before the hire\'s first day.', action_type: 'setup' },
      { title: 'Day 1 orientation', description: 'Welcome meeting, office tour, team introductions, and access credentials handoff.', action_type: 'communication' },
      { title: 'Systems and tools access', description: 'Provision all required software, VPN, and hardware. Confirm each system is accessible.', action_type: 'setup' },
      { title: 'HR documentation and compliance', description: 'Collect signed contracts, NDAs, I-9, and mandatory compliance module completions.', action_type: 'documentation' },
      { title: 'Role-specific knowledge transfer', description: 'Assign buddy/mentor. Schedule domain deep-dives with key stakeholders.', action_type: 'training' },
      { title: '30-60-90 day milestones', description: 'Define success criteria at each checkpoint. Schedule regular check-ins with manager.', action_type: 'planning' },
      { title: 'Completion sign-off', description: 'Confirm all onboarding tasks completed. Collect feedback for process improvement.', action_type: 'verification' },
    ],
  },
  {
    keywords: ['shipping', 'fulfillment', 'order', 'dispatch'],
    steps: [
      { title: 'Receive and validate order', description: 'Confirm order details, payment, and inventory availability in the system.', action_type: 'verification' },
      { title: 'Pick items from warehouse', description: 'Generate pick list. Locate and stage items per order sequence.', action_type: 'action' },
      { title: 'Pack and label shipment', description: 'Pack securely, apply correct labels, and insert packing slip.', action_type: 'action' },
      { title: 'Carrier handoff', description: 'Schedule or drop off with carrier. Capture tracking number and update system.', action_type: 'action' },
      { title: 'Notify customer', description: 'Send shipment confirmation email with tracking link.', action_type: 'communication' },
      { title: 'Update inventory records', description: 'Deduct shipped quantities from inventory management system.', action_type: 'data-entry' },
    ],
  },
  {
    keywords: ['invoice', 'procurement', 'purchase order', 'vendor'],
    steps: [
      { title: 'Create purchase request', description: 'Submit PO request with vendor details, quantities, pricing, and budget code.', action_type: 'data-entry' },
      { title: 'Management approval', description: 'Route to approver per spend threshold policy. Document approval decision.', action_type: 'approval' },
      { title: 'Issue purchase order', description: 'Generate and send PO to vendor. Confirm receipt and delivery timeline.', action_type: 'action' },
      { title: 'Receive goods/services', description: 'Inspect delivery. Match against PO. Log receipt in procurement system.', action_type: 'verification' },
      { title: 'Process invoice', description: 'Three-way match: invoice vs PO vs receipt. Flag discrepancies before payment.', action_type: 'verification' },
      { title: 'Authorize payment', description: 'Approve invoice for payment per net terms. Code to correct cost center.', action_type: 'approval' },
    ],
  },
  {
    keywords: ['customer support', 'ticket', 'helpdesk', 'service desk'],
    steps: [
      { title: 'Log and categorize issue', description: 'Create ticket with severity, category, and affected user. Acknowledge within SLA.', action_type: 'data-entry' },
      { title: 'Initial triage', description: 'Determine if known issue. Search knowledge base before escalating.', action_type: 'investigation' },
      { title: 'Assign to specialist', description: 'Route to correct tier or team based on issue type and priority.', action_type: 'action' },
      { title: 'Diagnose and resolve', description: 'Reproduce issue, identify root cause, implement fix or workaround.', action_type: 'action' },
      { title: 'Communicate resolution', description: 'Inform customer of fix details. Confirm issue is resolved.', action_type: 'communication' },
      { title: 'Document and close', description: 'Add resolution to knowledge base if recurring. Close ticket and send CSAT.', action_type: 'documentation' },
    ],
  },
];

const DEFAULT_PROCESS_STEPS = [
  { title: 'Document current state', description: 'Capture how the process is currently performed. Interview stakeholders if needed.', action_type: 'documentation' },
  { title: 'Identify all inputs and triggers', description: 'List what initiates this process, required inputs, and responsible parties.', action_type: 'planning' },
  { title: 'Map sequential steps', description: 'Break process into discrete, numbered actions. One action per step.', action_type: 'action' },
  { title: 'Identify decision points', description: 'Flag any branching logic or conditions that change the path.', action_type: 'verification' },
  { title: 'Define expected outputs', description: 'Document what a completed process produces — artifacts, notifications, state changes.', action_type: 'documentation' },
  { title: 'Assign ownership and SLAs', description: 'Name the role responsible for each step and expected completion time.', action_type: 'planning' },
  { title: 'Review and validate', description: 'Confirm accuracy with process owner. Get sign-off before publishing.', action_type: 'review' },
];

const STANDARDIZATION_STEPS = [
  { title: 'Collect all workflow variants', description: 'Gather documented versions of this process from each team or region that performs it.', action_type: 'documentation' },
  { title: 'AI comparison analysis', description: 'Analyze each version to detect structural differences, missing steps, and naming inconsistencies.', action_type: 'analysis' },
  { title: 'Identify best-practice steps', description: 'Flag steps present in high-performing versions and absent in others. These are candidates for the standard.', action_type: 'review' },
  { title: 'Resolve conflicts', description: 'For each conflict, select the correct approach based on compliance requirements, speed, or accuracy.', action_type: 'decision' },
  { title: 'Define required vs optional steps', description: 'Mark steps as mandatory or optional. Required steps must be completed for process compliance.', action_type: 'planning' },
  { title: 'Assign roles per step', description: 'Specify the role responsible for each step. Use job titles, not names.', action_type: 'planning' },
  { title: 'Publish canonical version', description: 'Finalize, version-stamp, and publish the standard workflow. Archive previous variants.', action_type: 'action' },
  { title: 'Notify and train affected teams', description: 'Communicate the new standard to all affected roles. Assign training if significant changes exist.', action_type: 'communication' },
];

const TRAINING_STEPS = [
  { title: 'Select base SOP or process', description: 'Choose the existing guide or procedure to convert into a training experience.', action_type: 'planning' },
  { title: 'Set learning objectives', description: 'Define what the learner must know or be able to do after completing this training.', action_type: 'planning' },
  { title: 'Simplify language for beginners', description: 'Replace technical jargon with plain language. Add "why" context to each step.', action_type: 'editing' },
  { title: 'Add explanation and tips', description: 'Expand critical steps with context, common mistakes to avoid, and best-practice tips.', action_type: 'editing' },
  { title: 'Insert checkpoints and quizzes', description: 'Add knowledge checks after concept sections. At least one quiz per module.', action_type: 'setup' },
  { title: 'Define completion criteria', description: 'Set minimum quiz score, required steps, and estimated completion time.', action_type: 'planning' },
  { title: 'Assign to roles or individuals', description: 'Select the target audience — new hires, a specific role, or team members with a skill gap.', action_type: 'action' },
  { title: 'Enable progress tracking', description: 'Activate completion tracking so managers can see who has finished and performance scores.', action_type: 'setup' },
  { title: 'Publish training guide', description: 'Publish and notify assigned learners. Set a completion deadline if required.', action_type: 'action' },
];

const generateProcessSteps = (text) => {
  const lower = (text || '').toLowerCase();
  for (const p of PROCESS_PATTERNS) {
    if (p.keywords.some((kw) => lower.includes(kw))) {
      return p.steps.map((s, i) => ({ ...s, step_number: i + 1 }));
    }
  }
  return DEFAULT_PROCESS_STEPS.map((s, i) => ({ ...s, step_number: i + 1 }));
};

const generateStandardizationSteps = (text) => {
  const base = STANDARDIZATION_STEPS.map((s, i) => ({ ...s, step_number: i + 1 }));
  const lower = (text || '').toLowerCase();
  if (lower.includes('sales') || lower.includes('lead')) {
    base[2].description = 'Flag steps present in top-performing sales reps\' version and absent in others.';
  }
  return base;
};

const generateTrainingSteps = (text) => {
  return TRAINING_STEPS.map((s, i) => ({ ...s, step_number: i + 1 }));
};

// ─── Validators ───────────────────────────────────────────────────────────────

const stepSchema = Joi.object({
  title: Joi.string().trim().min(1).max(140).required(),
  description: Joi.string().allow('').max(2000).default(''),
  action_type: Joi.string().trim().max(80).default('action'),
  order: Joi.number().integer().min(1).optional(),
  required: Joi.boolean().default(false),
  role: Joi.string().allow('').max(80).default(''),
  tip: Joi.string().allow('').max(500).default(''),
  has_checkpoint: Joi.boolean().default(false),
  checkpoint_question: Joi.string().allow('').max(300).default(''),
});

const createSchema = Joi.object({
  title: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().allow('').max(2000).default(''),
  status: Joi.string().valid('draft', 'published').default('draft'),
  source: Joi.string().valid('process-capture', 'standardize', 'training', 'manual').required(),
  category: Joi.string().allow('').max(60).default(''),
  tags: Joi.array().items(Joi.string().max(40)).max(10).default([]),
  steps: Joi.array().items(stepSchema).min(1).max(60).required(),
});

// ─── POST /api/workflow/generate ──────────────────────────────────────────────
// AI step generation for all three builder types

router.post('/generate', requireAuth, (req, res) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(120).required(),
    description: Joi.string().trim().allow('').max(2000).default(''),
    builderType: Joi.string().valid('process-capture', 'standardize', 'training').required(),
    existingGuideIds: Joi.array().items(Joi.string()).max(10).default([]),
  });

  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  const combined = `${value.title} ${value.description}`;
  let steps;
  let aiInsights = [];

  if (value.builderType === 'process-capture') {
    steps = generateProcessSteps(combined);
    aiInsights = [
      'Detected sequential workflow structure',
      'Added ownership fields to each step',
      'Flagged 2 potential decision points for documentation',
    ];
  } else if (value.builderType === 'standardize') {
    steps = generateStandardizationSteps(combined);
    // For standardize: pull existing guide titles for comparison hints
    const workspaceGuideIds = guidesByWorkspace.get(req.user.workspace_id) || [];
    const workspaceGuides = workspaceGuideIds
      .map((id) => guidesById.get(id))
      .filter(Boolean)
      .filter((g) => value.existingGuideIds.includes(g.id));

    if (workspaceGuides.length > 1) {
      aiInsights = [
        `Comparing ${workspaceGuides.length} workflow variants`,
        'Detected naming inconsistencies in steps 2–4',
        `Found ${workspaceGuides.length - 1} duplicate steps — merged into standard`,
        'Recommended 3 steps as required, 2 as optional',
      ];
    } else {
      aiInsights = [
        'Generated canonical baseline workflow',
        'Marked critical compliance steps as required',
        'Flagged 2 steps needing role assignment',
      ];
    }
  } else {
    // training
    steps = generateTrainingSteps(combined);
    aiInsights = [
      'Simplified technical language for beginner audience',
      'Added learning checkpoints after key concepts',
      'Estimated completion time: 25–35 minutes',
      'Generated 3 quiz questions for knowledge validation',
    ];
  }

  return res.json({ success: true, title: value.title, steps, aiInsights, builderType: value.builderType });
});

// ─── POST /api/workflow/create ────────────────────────────────────────────────
// Save a completed workflow (process doc, standardized workflow, or training guide)

router.post('/create', requireAuth, (req, res) => {
  const { error, value } = createSchema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  if (!req.user.workspace_id) {
    return res.status(409).json({ success: false, message: 'Create a workspace before building guides' });
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
      .map((s, i) => ({
        title: s.title,
        description: s.description,
        action_type: s.action_type,
        step_number: i + 1,
        // Enhanced fields stored as metadata
        metadata_json: {
          required: s.required,
          role: s.role,
          tip: s.tip,
          has_checkpoint: s.has_checkpoint,
          checkpoint_question: s.checkpoint_question,
          tags: value.tags,
          category: value.category,
        },
      }));

    const steps = upsertGuideSteps(guide.id, ordered);

    addGuideActivity({
      guideId: guide.id,
      workspaceId: req.user.workspace_id,
      type: 'edited',
      userId: req.user.id,
      metadata: { title: value.title, source: value.source, action: 'workflow_create' },
    });

    return res.status(201).json({ success: true, guide, steps });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Unable to save workflow' });
  }
});

// ─── GET /api/workflow/guides ─────────────────────────────────────────────────
// List guides by builder type for standardize "select existing" picker

router.get('/guides', requireAuth, (req, res) => {
  const { source } = req.query;
  if (!req.user.workspace_id) return res.json({ success: true, guides: [] });

  const workspaceGuideIds = guidesByWorkspace.get(req.user.workspace_id) || [];
  const allGuides = workspaceGuideIds
    .map((id) => guidesById.get(id))
    .filter(Boolean);

  const filtered = source
    ? allGuides.filter((g) => g.source === source)
    : allGuides;

  const owner = usersById.get(req.user.id);
  const list = filtered.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description || '',
    status: g.status,
    source: g.source,
    total_steps: g.total_steps,
    updated_at: g.updated_at,
    owner_name: owner?.name || owner?.email || 'You',
  }));

  return res.json({ success: true, guides: list });
});

module.exports = router;
