const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { usersById, onboardingEvents, patchUser, createWorkspace, markOnboardingProgress } = require('../db/store');

// Minimal safe-user shaper (mirrors auth.js safeUser; avoids circular dep)
const safeUser = (u) => ({
  id:            u.id,
  name:          u.name,
  email:         u.email,
  provider:      u.auth_provider || 'email',
  avatar_url:    u.avatar_url || null,
  status:        u.status,
  email_verified: !!u.email_verified,
  is_onboarded:  u.is_onboarded ?? false,
  team_name:     u.team_name || null,
  workspace_id:  u.workspace_id || null,
});

const router = express.Router();

// ─── Auth middleware (local copy — avoids circular dep with auth.js) ─────────

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'dev-secret');
    const user    = usersById.get(decoded.sub);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// ─── Validation schemas ───────────────────────────────────────────────────────

const legacyOnboardingSchema = Joi.object({
  email:               Joi.string().email({ tlds: { allow: false } }).allow('', null).optional(),
  userType:            Joi.string().valid('work', 'personal').allow('', null).optional(),
  useCases:            Joi.array().items(Joi.string().max(100)).max(10).default([]),
  team:                Joi.string().max(128).allow('', null).optional(),
  source_page:         Joi.string().max(255).allow('', null).optional(),
  cta_clicked:         Joi.string().max(255).allow('', null).optional(),
  campaign_source:     Joi.string().max(255).allow('', null).optional(),
  onboarding_step_data: Joi.object().unknown(true).optional(),
});

// ─── POST /api/onboarding  (legacy lead-capture endpoint — pre-login) ────────

router.post('/', (req, res) => {
  const { error, value } = legacyOnboardingSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
  }

  const id  = uuidv4();
  const now = new Date().toISOString();
  const event = {
    id,
    email:                value.email || null,
    selected_persona:     value.userType || null,
    selected_use_case:    (value.useCases || [])[0] || null,
    selected_team:        value.team || null,
    use_cases:            value.useCases || [],
    source_page:          value.source_page || null,
    cta_clicked:          value.cta_clicked || null,
    campaign_source:      value.campaign_source || null,
    onboarding_step_data: value.onboarding_step_data || {},
    created_at:           now,
  };

  onboardingEvents.set(id, event);
  return res.status(201).json({ success: true, message: 'Onboarding event stored', event });
});

// ─── POST /api/onboarding/team  (Step 1: name workspace) ─────────────────────

router.post('/team', requireAuth, (req, res) => {
  const schema = Joi.object({ team_name: Joi.string().trim().min(2).max(120).required() });
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({ success: false, message: 'Verify your email before creating a workspace.' });
  }

  if (req.user.workspace_id) {
    // Workspace already exists — idempotent, return success
    return res.json({ success: true, message: 'Workspace already created' });
  }

  const workspace = createWorkspace(req.user.id, value.team_name);
  console.log(`[onboarding/team] Workspace created: "${value.team_name}" for ${req.user.email}`);

  // Re-fetch user so we return the latest state (workspace_id now set)
  const updatedUser = usersById.get(req.user.id);
  return res.status(201).json({ success: true, workspace, user: safeUser(updatedUser) });
});

// ─── POST /api/onboarding/invite  (Step 2: invite teammates — optional) ──────

router.post('/invite', requireAuth, (req, res) => {
  const schema = Joi.object({
    emails: Joi.array()
      .items(Joi.string().email({ tlds: { allow: false } }))
      .min(1)
      .max(20)
      .required(),
  });
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ success: false, message: 'Provide at least one valid email address.' });
  }

  // In production: send actual invite emails here.
  // For now we log them so developers can see the invites.
  const validEmails = value.emails.filter(Boolean);
  console.log(`[onboarding/invite] ${req.user.email} invited: ${validEmails.join(', ')}`);
  markOnboardingProgress(req.user.id, { invitedTeam: true });

  return res.json({
    success: true,
    message: `Invites sent to ${validEmails.length} address${validEmails.length > 1 ? 'es' : ''}.`,
    invited: validEmails,
  });
});

// ─── POST /api/onboarding/complete  (Step 3: mark user as fully onboarded) ───

router.post('/complete', requireAuth, (req, res) => {
  const updated = patchUser(req.user.id, { is_onboarded: true });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  console.log(`[onboarding/complete] ✓ ${req.user.email} onboarding complete`);

  return res.json({ success: true, message: 'Onboarding complete', is_onboarded: true });
});

// ─── GET /api/onboarding/:id  (legacy lookup) ────────────────────────────────

router.get('/:id', (req, res) => {
  const event = onboardingEvents.get(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  return res.json({ success: true, event });
});

module.exports = router;
