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

// ─── AI Step Generator ────────────────────────────────────────────────────────
// Smart keyword-based SOP generation (no external API required)

const DOMAIN_PATTERNS = [
  {
    keywords: ['onboard', 'new hire', 'new employee', 'new staff', 'join'],
    steps: [
      { title: 'Prepare workspace accounts', description: 'Create email, Slack, and system accounts for the new hire before their first day.', action_type: 'setup' },
      { title: 'Send welcome email with first-day instructions', description: 'Include office location/remote setup info, first-day schedule, and key contacts.', action_type: 'communication' },
      { title: 'Set up equipment and access credentials', description: 'Provision laptop, security badge, and VPN access. Confirm all tools are installed.', action_type: 'setup' },
      { title: 'Complete HR paperwork and compliance training', description: 'Collect signed contracts, NDAs, and I-9 forms. Assign mandatory compliance modules.', action_type: 'documentation' },
      { title: 'Introduce to team and key stakeholders', description: 'Schedule 30-minute intro calls with direct team, manager, and cross-functional partners.', action_type: 'communication' },
      { title: 'Assign 30-60-90 day onboarding plan', description: 'Share written milestones and success criteria. Schedule weekly check-ins.', action_type: 'planning' },
      { title: 'Review and confirm onboarding completion', description: 'Conduct 30-day debrief to address gaps and confirm the hire is fully operational.', action_type: 'review' },
    ],
  },
  {
    keywords: ['invoice', 'accounts payable', 'ap process', 'billing', 'payment'],
    steps: [
      { title: 'Receive and log incoming invoice', description: 'Record invoice in the AP system with vendor name, amount, due date, and PO reference.', action_type: 'data-entry' },
      { title: 'Verify invoice against purchase order', description: 'Three-way match: invoice vs. PO vs. goods receipt. Flag discrepancies for review.', action_type: 'verification' },
      { title: 'Route to approver based on spend threshold', description: 'Under $1K: auto-approve. $1K–$10K: manager approval. Over $10K: VP or CFO sign-off.', action_type: 'approval' },
      { title: 'Code invoice to correct cost center and GL account', description: 'Apply correct department codes and general ledger categories per chart of accounts.', action_type: 'accounting' },
      { title: 'Schedule payment per vendor terms', description: 'Queue payment for net-30/60/90 date. Apply early-pay discount if available.', action_type: 'payment' },
      { title: 'Confirm payment and update records', description: 'Send payment confirmation to vendor. Mark invoice as paid in AP system.', action_type: 'confirmation' },
    ],
  },
  {
    keywords: ['crm', 'lead', 'sales', 'prospect', 'opportunity', 'pipeline'],
    steps: [
      { title: 'Qualify the inbound lead', description: 'Apply BANT criteria: Budget, Authority, Need, Timeline. Score the lead before logging.', action_type: 'qualification' },
      { title: 'Create lead record in CRM', description: 'Open CRM → Leads → New Lead. Enter name, company, email, phone, and source.', action_type: 'data-entry' },
      { title: 'Assign to the correct sales rep', description: 'Route by territory, industry vertical, or round-robin assignment rules.', action_type: 'assignment' },
      { title: 'Send initial outreach within 5 minutes', description: 'Use approved email template. Personalize subject line and opening. Log send in CRM.', action_type: 'communication' },
      { title: 'Schedule discovery call within 48 hours', description: 'Propose 3 time slots via calendar link. Confirm agenda and preparation materials.', action_type: 'scheduling' },
      { title: 'Convert lead to opportunity after discovery', description: 'Update CRM stage to Opportunity. Add deal value, close date, and next step.', action_type: 'conversion' },
    ],
  },
  {
    keywords: ['support', 'ticket', 'customer issue', 'helpdesk', 'escalation', 'complaint'],
    steps: [
      { title: 'Acknowledge the customer within 1 hour', description: 'Send automated acknowledgment with ticket number. Set response time expectation per SLA tier.', action_type: 'communication' },
      { title: 'Categorize and prioritize the ticket', description: 'Assign severity (P1–P4) based on business impact. Tag product area and issue type.', action_type: 'classification' },
      { title: 'Reproduce and diagnose the issue', description: 'Use customer environment details to reproduce. Check error logs and known issue database.', action_type: 'investigation' },
      { title: 'Apply fix or workaround', description: 'Implement solution or provide clear workaround steps. Test before sharing with customer.', action_type: 'resolution' },
      { title: 'Communicate resolution to customer', description: 'Explain what happened, what was fixed, and any preventative steps. Verify customer satisfaction.', action_type: 'communication' },
      { title: 'Document in knowledge base if recurring', description: 'If seen 2+ times, write KB article. Link from ticket for future reference.', action_type: 'documentation' },
      { title: 'Close ticket and log learnings', description: 'Update ticket status. Add internal notes on root cause. Trigger CSAT survey.', action_type: 'closure' },
    ],
  },
  {
    keywords: ['deploy', 'deployment', 'release', 'devops', 'ci/cd', 'ship', 'launch'],
    steps: [
      { title: 'Create and review pull request', description: 'Ensure all tests pass. Require two approvals. Link to relevant Jira/Linear ticket.', action_type: 'development' },
      { title: 'Run automated test suite', description: 'Trigger CI pipeline. All unit, integration, and E2E tests must pass before proceeding.', action_type: 'testing' },
      { title: 'Deploy to staging environment', description: 'Merge to staging branch. Monitor deployment logs. Run smoke tests on critical flows.', action_type: 'deployment' },
      { title: 'Conduct pre-production sign-off', description: 'QA lead signs off. PM confirms feature completeness. Security scan passes.', action_type: 'approval' },
      { title: 'Deploy to production with feature flags', description: 'Use canary deployment or feature flag rollout. Start at 1–5% traffic.', action_type: 'deployment' },
      { title: 'Monitor dashboards for 30 minutes post-deploy', description: 'Watch error rates, latency, and key business metrics. Have rollback plan ready.', action_type: 'monitoring' },
      { title: 'Announce release and update changelog', description: 'Post to #releases Slack channel. Update public changelog. Notify affected customers.', action_type: 'communication' },
    ],
  },
  {
    keywords: ['expense', 'reimbursement', 'travel', 'spend', 'receipt'],
    steps: [
      { title: 'Collect all receipts and documentation', description: 'Gather digital or physical receipts for all business expenses. Note business purpose for each.', action_type: 'documentation' },
      { title: 'Submit expense report via approved system', description: 'Log into Concur/Expensify/system. Create new report. Enter expenses with category and cost center.', action_type: 'submission' },
      { title: 'Attach receipts to each line item', description: 'Upload digital receipts or photos. Ensure receipt shows date, vendor, and amount.', action_type: 'documentation' },
      { title: 'Manager reviews and approves report', description: 'Manager checks policy compliance, budget availability, and business justification. Approves or flags for correction.', action_type: 'approval' },
      { title: 'Finance processes reimbursement', description: 'Finance validates amounts against policy limits. Processes payment in next payroll or direct deposit cycle.', action_type: 'payment' },
    ],
  },
  {
    keywords: ['it setup', 'laptop', 'computer', 'system setup', 'workstation', 'provisioning'],
    steps: [
      { title: 'Order and receive hardware', description: 'Submit hardware request via IT ticketing system. Track delivery. Inspect for damage on arrival.', action_type: 'procurement' },
      { title: 'Enroll device in MDM system', description: 'Register serial number in Jamf/Intune. Apply company security profile and encryption.', action_type: 'setup' },
      { title: 'Install required software applications', description: 'Deploy standard software bundle: Office suite, browser, VPN client, Slack, security tools.', action_type: 'installation' },
      { title: 'Configure user accounts and permissions', description: 'Set up SSO, email client, and system access. Apply least-privilege permission model.', action_type: 'configuration' },
      { title: 'Run security compliance check', description: 'Verify disk encryption, firewall, antivirus, and OS patch status. Remediate any failures.', action_type: 'security' },
      { title: 'Hand off device and train user', description: 'Walk through key setup and security policies. Provide IT support contact info.', action_type: 'handoff' },
    ],
  },
  {
    keywords: ['train', 'training', 'learning', 'course', 'certification', 'workshop', 'skill'],
    steps: [
      { title: 'Identify learning objectives and audience', description: 'Define what learners will be able to do after training. Identify prerequisites and target role.', action_type: 'planning' },
      { title: 'Design curriculum and content outline', description: 'Break into modules. Define sequence, duration, and delivery method (e-learning/live/blended).', action_type: 'design' },
      { title: 'Create training materials', description: 'Build slides, recorded demos, exercises, and job aids. Review with subject matter experts.', action_type: 'creation' },
      { title: 'Schedule and communicate training sessions', description: 'Send calendar invites and pre-work 2 weeks ahead. Include agenda and login links.', action_type: 'scheduling' },
      { title: 'Deliver training and collect real-time feedback', description: 'Facilitate session. Use polls and Q&A. Capture attendance and completion rates.', action_type: 'delivery' },
      { title: 'Assess learning outcomes', description: 'Administer post-training quiz or skills assessment. Target 80%+ pass rate.', action_type: 'assessment' },
      { title: 'Iterate and publish to knowledge base', description: 'Incorporate feedback. Publish final version. Schedule quarterly review for updates.', action_type: 'improvement' },
    ],
  },
];

const DEFAULT_STEPS = [
  { title: 'Define the objective and scope', description: 'Clearly state what this SOP covers, who it applies to, and what success looks like.', action_type: 'planning' },
  { title: 'Gather required tools and resources', description: 'List all systems, accounts, documents, and materials needed to complete this process.', action_type: 'setup' },
  { title: 'Execute the primary workflow', description: 'Follow the core steps of the process in sequence. Document any decisions or branching paths.', action_type: 'action' },
  { title: 'Verify output quality', description: 'Check that the expected output was produced correctly. Compare against acceptance criteria.', action_type: 'verification' },
  { title: 'Document and communicate outcome', description: 'Record results, update relevant systems, and notify stakeholders of completion.', action_type: 'documentation' },
  { title: 'Archive and review for future improvement', description: 'Store artifacts in the correct location. Schedule periodic reviews to keep this SOP current.', action_type: 'review' },
];

/**
 * Match input text against domain patterns, fall back to generic steps.
 * Returns an array of step objects.
 */
const generateStepsFromText = (text) => {
  const lower = text.toLowerCase();
  for (const pattern of DOMAIN_PATTERNS) {
    if (pattern.keywords.some((kw) => lower.includes(kw))) {
      return pattern.steps.map((s, i) => ({ ...s, order: i + 1 }));
    }
  }
  return DEFAULT_STEPS.map((s, i) => ({ ...s, order: i + 1 }));
};

// ─── POST /api/sop/from-text ─────────────────────────────────────────────────
// Generate SOP steps from a text description (no guide created yet)

router.post('/from-text', requireAuth, (req, res) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(120).required(),
    description: Joi.string().trim().allow('').max(2000).default(''),
  });
  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  const combinedInput = `${value.title} ${value.description}`;
  const steps = generateStepsFromText(combinedInput);

  return res.json({ success: true, title: value.title, steps, source: 'ai-text' });
});

// ─── POST /api/sop/create ─────────────────────────────────────────────────────
// Create a guide with pre-populated steps in one request

router.post('/create', requireAuth, (req, res) => {
  const stepSchema = Joi.object({
    title: Joi.string().trim().min(1).max(140).required(),
    description: Joi.string().allow('').max(2000).default(''),
    action_type: Joi.string().trim().max(80).default('action'),
    order: Joi.number().integer().min(1).optional(),
  });

  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(120).required(),
    description: Joi.string().allow('').max(2000).default(''),
    status: Joi.string().valid('draft', 'published').default('draft'),
    source: Joi.string().valid('ai-text', 'template', 'manual', 'recording', 'video', 'document').default('manual'),
    steps: Joi.array().items(stepSchema).min(1).max(50).required(),
  });

  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  if (!req.user.workspace_id) {
    return res.status(409).json({ success: false, message: 'Create a workspace before building SOPs' });
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
      }));

    const steps = upsertGuideSteps(guide.id, ordered);

    addGuideActivity({
      guideId: guide.id,
      workspaceId: req.user.workspace_id,
      type: 'edited',
      userId: req.user.id,
      metadata: { title: value.title, source: value.source, action: 'sop_create' },
    });

    return res.status(201).json({ success: true, guide, steps });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Unable to save SOP' });
  }
});

module.exports = router;
