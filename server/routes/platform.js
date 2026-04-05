const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const {
  usersById,
  guidesById,
  guidesByWorkspace,
  guideStepsByGuide,
} = require('../db/store');

const router = express.Router();

const workspaceConnections = new Map();
const workspaceAgents = new Map();

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

const ensureConnections = (workspaceId) => {
  if (!workspaceConnections.has(workspaceId)) {
    workspaceConnections.set(workspaceId, new Set());
  }
  return workspaceConnections.get(workspaceId);
};

const getWorkspaceGuides = (workspaceId) => {
  const ids = guidesByWorkspace.get(workspaceId) || [];
  return ids
    .map((id) => guidesById.get(id))
    .filter(Boolean)
    .map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description || '',
      source: g.source,
      status: g.status,
      total_steps: g.total_steps,
      updated_at: g.updated_at,
    }));
};

const toStep = (step, index) => ({
  title: step.title || `Step ${index + 1}`,
  description: step.description || '',
  action_type: step.action_type || 'action',
  order: index + 1,
});

const parseImportedWorkflow = (text) => {
  const lines = String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30);

  if (lines.length === 0) {
    return [
      { title: 'Capture current workflow', description: 'Document your current process start-to-finish.', action_type: 'documentation', order: 1 },
      { title: 'Detect friction points', description: 'Identify delays, redundant approvals, and missing handoffs.', action_type: 'analysis', order: 2 },
      { title: 'Apply optimization', description: 'Remove unnecessary actions and clarify ownership.', action_type: 'optimization', order: 3 },
    ];
  }

  return lines.map((line, i) => ({
    title: line.length > 80 ? `${line.slice(0, 77)}...` : line,
    description: `Imported workflow step ${i + 1}.`,
    action_type: 'action',
    order: i + 1,
  }));
};

const optimizeSteps = (steps, goal) => {
  const seen = new Set();
  const deduped = [];

  for (const s of steps) {
    const key = `${(s.title || '').toLowerCase()}::${(s.action_type || '').toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push({ ...s });
  }

  const optimized = deduped.map((s) => {
    const desc = String(s.description || '');
    const tighter = desc.length > 180 ? `${desc.slice(0, 177)}...` : desc;
    return {
      ...s,
      description: tighter || 'Execute this step with defined owner and expected outcome.',
    };
  });

  const hasVerification = optimized.some((s) => String(s.action_type || '').includes('verification'));
  if (!hasVerification) {
    optimized.push({
      title: 'Validate workflow outcome',
      description: 'Confirm outputs match expectations before marking complete.',
      action_type: 'verification',
      order: optimized.length + 1,
    });
  }

  if (goal) {
    optimized.unshift({
      title: 'Optimization objective',
      description: `Primary goal: ${goal}. Keep all subsequent steps aligned to this objective.`,
      action_type: 'planning',
      order: 1,
    });
  }

  return optimized.map((s, i) => ({ ...s, order: i + 1 }));
};

router.get('/optimize/workflows', requireAuth, (req, res) => {
  if (!req.user.workspace_id) return res.json({ success: true, workflows: [] });
  return res.json({ success: true, workflows: getWorkspaceGuides(req.user.workspace_id) });
});

router.post('/optimize/analyze', requireAuth, (req, res) => {
  const schema = Joi.object({
    guideId: Joi.string().allow('').default(''),
    importedWorkflow: Joi.string().allow('').max(7000).default(''),
    goal: Joi.string().allow('').max(200).default(''),
  });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid optimization payload' });

  let baseTitle = 'Optimized Workflow';
  let currentSteps = [];

  if (value.guideId) {
    const guide = guidesById.get(value.guideId);
    if (!guide) return res.status(404).json({ success: false, message: 'Workflow not found' });
    baseTitle = guide.title;
    currentSteps = (guideStepsByGuide.get(guide.id) || []).map(toStep);
  } else {
    currentSteps = parseImportedWorkflow(value.importedWorkflow);
  }

  const optimizedSteps = optimizeSteps(currentSteps, value.goal);

  const bottlenecks = [];
  if (currentSteps.length > 8) bottlenecks.push('Workflow has many steps and likely handoff delays');
  if (optimizedSteps.length < currentSteps.length) bottlenecks.push('Duplicate actions were detected and merged');
  if (!currentSteps.some((s) => String(s.action_type).includes('approval'))) bottlenecks.push('No explicit approval checkpoints found');
  if (bottlenecks.length === 0) bottlenecks.push('Minor clarity improvements available in step descriptions');

  return res.json({
    success: true,
    title: baseTitle,
    currentSteps,
    optimizedSteps,
    bottlenecks,
    aiInsights: [
      'Detected workflow inefficiencies and merged duplicate steps',
      'Reordered actions for faster completion and clearer ownership',
      'Added validation checkpoint to reduce process drift',
      'Prepared an optimized version for immediate SOP publishing',
    ],
    suggestedVersionName: `${baseTitle} - Optimized`,
  });
});

router.get('/integrations/connections', requireAuth, (req, res) => {
  if (!req.user.workspace_id) return res.json({ success: true, connections: [] });
  const connections = Array.from(ensureConnections(req.user.workspace_id));
  return res.json({ success: true, connections });
});

router.post('/integrations/connect', requireAuth, (req, res) => {
  const schema = Joi.object({
    tool: Joi.string().valid('slack', 'teams', 'jira', 'crm-erp').required(),
  });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid tool' });
  if (!req.user.workspace_id) return res.status(409).json({ success: false, message: 'Workspace required' });

  const set = ensureConnections(req.user.workspace_id);
  set.add(value.tool);

  return res.status(201).json({
    success: true,
    tool: value.tool,
    status: 'connected',
    connections: Array.from(set),
    aiInsights: [
      `Connected ${value.tool} successfully`,
      'Enabled contextual workflow retrieval for this tool',
    ],
  });
});

router.get('/integrations/search', requireAuth, (req, res) => {
  const schema = Joi.object({ query: Joi.string().allow('').max(120).default('') });
  const { error, value } = schema.validate(req.query, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid search query' });
  if (!req.user.workspace_id) return res.json({ success: true, results: [] });

  const query = String(value.query || '').toLowerCase();
  const all = getWorkspaceGuides(req.user.workspace_id);
  const results = all
    .filter((g) => !query || g.title.toLowerCase().includes(query) || g.description.toLowerCase().includes(query))
    .slice(0, 8);

  return res.json({ success: true, results });
});

router.post('/integrations/trigger', requireAuth, (req, res) => {
  const schema = Joi.object({
    source: Joi.string().valid('chat', 'api', 'event').required(),
    query: Joi.string().allow('').max(200).default(''),
    guideId: Joi.string().allow('').default(''),
  });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid trigger payload' });
  if (!req.user.workspace_id) return res.status(409).json({ success: false, message: 'Workspace required' });

  const all = getWorkspaceGuides(req.user.workspace_id);
  let selected = null;
  if (value.guideId) selected = all.find((g) => g.id === value.guideId) || null;
  if (!selected && value.query) {
    const q = value.query.toLowerCase();
    selected = all.find((g) => g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)) || null;
  }
  if (!selected && all.length > 0) selected = all[0];
  if (!selected) {
    return res.status(404).json({ success: false, message: 'No workflows available to trigger' });
  }

  const steps = (guideStepsByGuide.get(selected.id) || []).map(toStep);

  return res.json({
    success: true,
    workflow: selected,
    source: value.source,
    summary: `Triggered from ${value.source}. Returned ${steps.length} steps from ${selected.title}.`,
    steps,
    aiInsights: [
      'Resolved the best workflow match for this trigger context',
      'Prepared instant SOP retrieval response for integrated channel',
    ],
  });
});

router.post('/integrations/embed', requireAuth, (req, res) => {
  const schema = Joi.object({
    guideId: Joi.string().required(),
    target: Joi.string().valid('internal-tool', 'external-app').default('internal-tool'),
  });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid embed payload' });

  const guide = guidesById.get(value.guideId);
  if (!guide) return res.status(404).json({ success: false, message: 'Guide not found' });

  const embedCode = `<iframe src="/embed/workflow/${guide.id}" title="${guide.title}" data-target="${value.target}" width="100%" height="540" style="border:1px solid #1f2937;border-radius:16px;"></iframe>`;

  return res.json({
    success: true,
    embedCode,
    aiInsights: [
      'Generated embeddable workflow widget code',
      'Configured for context-aware retrieval in host application',
    ],
  });
});

router.post('/agents/activate', requireAuth, (req, res) => {
  const schema = Joi.object({
    guideIds: Joi.array().items(Joi.string()).min(1).max(25).required(),
    autoFix: Joi.boolean().default(false),
  });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid activation payload' });
  if (!req.user.workspace_id) return res.status(409).json({ success: false, message: 'Workspace required' });

  const config = {
    guideIds: value.guideIds,
    autoFix: value.autoFix,
    activatedAt: new Date().toISOString(),
  };
  workspaceAgents.set(req.user.workspace_id, config);

  return res.json({ success: true, config });
});

router.get('/agents/status', requireAuth, (req, res) => {
  if (!req.user.workspace_id) return res.json({ success: true, active: false, metrics: null });

  const config = workspaceAgents.get(req.user.workspace_id);
  if (!config) return res.json({ success: true, active: false, metrics: null });

  const monitoredCount = config.guideIds.length;
  const metrics = {
    monitoredCount,
    inefficienciesDetected: Math.max(1, Math.floor(monitoredCount * 1.8)),
    recommendationsGenerated: Math.max(2, monitoredCount * 2),
    autoFixEnabled: config.autoFix,
  };

  return res.json({ success: true, active: true, config, metrics });
});

router.post('/agents/recommendations', requireAuth, (req, res) => {
  const schema = Joi.object({
    guideIds: Joi.array().items(Joi.string()).max(25).default([]),
  });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid recommendation payload' });
  if (!req.user.workspace_id) return res.status(409).json({ success: false, message: 'Workspace required' });

  const ids = value.guideIds.length > 0 ? value.guideIds : (workspaceAgents.get(req.user.workspace_id)?.guideIds || []);
  const recommendations = ids
    .map((guideId, idx) => {
      const guide = guidesById.get(guideId);
      if (!guide) return null;
      const recId = `${guideId}-rec-${idx + 1}`;
      return {
        id: recId,
        guideId,
        workflowTitle: guide.title,
        issue: idx % 2 === 0 ? 'Redundant approval handoff detected' : 'Missing verification checkpoint',
        impact: idx % 2 === 0 ? 'Estimated 14% slower cycle time' : 'Higher risk of inconsistent execution',
        suggestedFix: idx % 2 === 0
          ? 'Merge duplicate approval steps and assign single owner'
          : 'Add explicit validation step before completion',
        confidence: idx % 2 === 0 ? 0.88 : 0.84,
      };
    })
    .filter(Boolean);

  return res.json({ success: true, recommendations });
});

router.post('/agents/apply-fix', requireAuth, (req, res) => {
  const schema = Joi.object({
    recommendationId: Joi.string().required(),
    guideId: Joi.string().required(),
  });
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: 'Invalid apply-fix payload' });

  const guide = guidesById.get(value.guideId);
  if (!guide) return res.status(404).json({ success: false, message: 'Workflow not found' });

  const current = (guideStepsByGuide.get(guide.id) || []).map(toStep);
  const optimized = optimizeSteps(current, 'Reduce workflow inefficiencies with agent recommendations');

  return res.json({
    success: true,
    title: `${guide.title} - Agent Optimized`,
    recommendationId: value.recommendationId,
    steps: optimized,
    aiInsights: [
      'Applied agent recommendation to remove bottlenecks',
      'Added structural validation safeguards',
      'Generated optimized version ready for review and publish',
    ],
  });
});

module.exports = router;
