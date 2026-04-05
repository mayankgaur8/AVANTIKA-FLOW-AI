const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const {
  usersById,
  markOnboardingProgress,
  createGuide,
  shareGuideSettings,
  getDashboardBootstrap,
  getRecentData,
  getFavoriteGuides,
} = require('../db/store');

const router = express.Router();

const safeUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  provider: u.auth_provider || 'email',
  avatar_url: u.avatar_url || null,
  status: u.status,
  email_verified: !!u.email_verified,
  is_onboarded: u.is_onboarded ?? false,
  team_name: u.team_name || null,
  workspace_id: u.workspace_id || null,
  onboarding_progress: u.onboarding_progress,
});

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'dev-secret');
    const user = usersById.get(decoded.sub);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid session' });
  }
};

router.get('/bootstrap', requireAuth, (req, res) => {
  const data = getDashboardBootstrap(req.user.id);
  if (!data) {
    return res.status(404).json({ success: false, message: 'Dashboard data not found' });
  }

  return res.json({
    success: true,
    user: safeUser(data.user),
    workspace: data.workspace,
    guides: data.guides,
    checklist: data.checklist,
    stats: data.stats,
    recentActivity: data.recentActivity,
  });
});

router.get('/recent', requireAuth, (req, res) => {
  const data = getRecentData(req.user.id);
  if (!data) {
    return res.status(404).json({ success: false, message: 'Recent data not found' });
  }

  return res.json({
    success: true,
    recentGuides: data.recentGuides,
    recentActivity: data.recentActivity,
  });
});

router.get('/favorites', requireAuth, (req, res) => {
  const favorites = getFavoriteGuides(req.user);
  return res.json({ success: true, favorites });
});

router.post('/guides', requireAuth, (req, res) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(120).required(),
    mode: Joi.string().valid('recording', 'manual').default('manual'),
    isSample: Joi.boolean().default(false),
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });
  }

  if (!req.user.workspace_id) {
    return res.status(409).json({ success: false, message: 'Create a workspace first' });
  }

  const guide = createGuide({
    workspaceId: req.user.workspace_id,
    userId: req.user.id,
    title: value.title,
    mode: value.mode,
    isSample: value.isSample,
  });

  return res.status(201).json({
    success: true,
    guide: {
      ...guide,
      steps: guide.total_steps,
      shared: guide.share_type && guide.share_type !== 'private',
    },
  });
});

router.post('/guides/:guideId/share', requireAuth, (req, res) => {
  if (!req.user.workspace_id) {
    return res.status(409).json({ success: false, message: 'Create a workspace first' });
  }

  const result = shareGuideSettings({
    guideId: req.params.guideId,
    userId: req.user.id,
    shareType: 'workspace',
    publish: true,
  });

  if (!result) {
    return res.status(404).json({ success: false, message: 'Guide not found' });
  }

  return res.json({
    success: true,
    guide: {
      ...result.guide,
      steps: result.guide.total_steps,
      shared: result.guide.share_type && result.guide.share_type !== 'private',
    },
  });
});

router.post('/checklist/:key/complete', requireAuth, (req, res) => {
  const allowed = ['invitedTeam', 'installedExtension', 'createdGuide', 'sharedGuide'];
  if (!allowed.includes(req.params.key)) {
    return res.status(400).json({ success: false, message: 'Invalid checklist key' });
  }

  const updated = markOnboardingProgress(req.user.id, { [req.params.key]: true });
  return res.json({ success: true, onboarding_progress: updated?.onboarding_progress || null });
});

module.exports = router;
