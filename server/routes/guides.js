const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const {
  usersById,
  startRecordingSession,
  appendRecordingStep,
  finishRecordingSession,
  listGuidesForUser,
  getGuideForUser,
  updateGuide,
  shareGuideSettings,
  incrementGuideView,
  getPublicGuideBySlug,
  duplicateGuide,
  deleteGuide,
  appendGuideStep,
  updateGuideStep,
  deleteGuideStep,
  startGuideRecording,
  finishGuideRecording,
  addFavorite,
  removeFavorite,
  isFavorite,
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

router.post('/record/start', requireAuth, (req, res) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(120).optional(),
  });
  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  if (!req.user.workspace_id) {
    return res.status(409).json({ success: false, message: 'Create a workspace before recording guides' });
  }

  const session = startRecordingSession({
    workspaceId: req.user.workspace_id,
    userId: req.user.id,
    title: value.title || 'Untitled workflow',
  });

  return res.status(201).json({ success: true, session });
});

router.post('/record/step', requireAuth, (req, res) => {
  const schema = Joi.object({
    sessionId: Joi.string().required(),
    title: Joi.string().trim().min(1).max(140).required(),
    description: Joi.string().allow('').max(2000).default(''),
    screenshotUrl: Joi.string().uri().allow(null, '').optional(),
    actionType: Joi.string().trim().max(80).default('action'),
    metadataJson: Joi.object().unknown(true).default({}),
  });

  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  const step = appendRecordingStep({
    sessionId: value.sessionId,
    step: {
      title: value.title,
      description: value.description,
      screenshotUrl: value.screenshotUrl || null,
      actionType: value.actionType,
      metadataJson: value.metadataJson,
    },
  });

  if (!step) return res.status(404).json({ success: false, message: 'Recording session not found' });
  return res.status(201).json({ success: true, step });
});

router.post('/record/finish', requireAuth, (req, res) => {
  const schema = Joi.object({
    sessionId: Joi.string().required(),
    title: Joi.string().trim().min(2).max(120).required(),
    description: Joi.string().allow('').max(2000).default(''),
    thumbnailUrl: Joi.string().uri().allow(null, '').optional(),
    status: Joi.string().valid('draft', 'published').default('draft'),
  });

  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  const result = finishRecordingSession({
    sessionId: value.sessionId,
    title: value.title,
    description: value.description,
    thumbnailUrl: value.thumbnailUrl || null,
    status: value.status,
  });

  if (!result) return res.status(404).json({ success: false, message: 'Recording session not found' });

  return res.json({ success: true, guide: result.guide, steps: result.steps });
});

router.get('/', requireAuth, (req, res) => {
  const guides = listGuidesForUser(req.user);
  return res.json({ success: true, guides });
});

router.get('/shared/:slug', (req, res) => {
  const found = getPublicGuideBySlug(req.params.slug);
  if (!found) return res.status(404).json({ success: false, message: 'Guide not found' });
  return res.json({ success: true, ...found });
});

router.get('/:guideId', requireAuth, (req, res) => {
  const found = getGuideForUser({ user: req.user, guideId: req.params.guideId, shareToken: req.query.shareToken || null });
  if (!found) return res.status(404).json({ success: false, message: 'Guide not found' });
  if (found.forbidden) return res.status(403).json({ success: false, message: 'You do not have access to this guide' });
  return res.json({
    success: true,
    ...found,
    guide: { ...found.guide, is_favorite: isFavorite(req.user.id, req.params.guideId) },
  });
});

// ─── Favorites ────────────────────────────────────────────────────────────────

router.post('/:guideId/favorite', requireAuth, (req, res) => {
  const found = getGuideForUser({ user: req.user, guideId: req.params.guideId });
  if (!found) return res.status(404).json({ success: false, message: 'Guide not found' });
  if (found.forbidden) return res.status(403).json({ success: false, message: 'Access denied' });
  addFavorite(req.user.id, req.params.guideId);
  return res.json({ success: true, is_favorite: true });
});

router.delete('/:guideId/favorite', requireAuth, (req, res) => {
  removeFavorite(req.user.id, req.params.guideId);
  return res.json({ success: true, is_favorite: false });
});

router.patch('/:guideId', requireAuth, (req, res) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(120).optional(),
    description: Joi.string().allow('').max(2000).optional(),
    status: Joi.string().valid('draft', 'published').optional(),
    thumbnail_url: Joi.string().uri().allow(null, '').optional(),
    // Video fields
    video_type: Joi.string().valid('youtube', 'uploaded', 'recorded').allow(null).optional(),
    video_url: Joi.string().uri().allow(null, '').optional(),
    embed_url: Joi.string().uri().allow(null, '').optional(),
    duration_seconds: Joi.number().integer().min(0).allow(null).optional(),
  }).min(1);

  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  const updated = updateGuide({ guideId: req.params.guideId, userId: req.user.id, patch: value });
  if (!updated) return res.status(404).json({ success: false, message: 'Guide not found' });
  if (updated.forbidden) return res.status(403).json({ success: false, message: 'Only owner can update guide' });

  return res.json({ success: true, guide: updated });
});

router.post('/:guideId/share', requireAuth, (req, res) => {
  const schema = Joi.object({
    shareType: Joi.string().valid('private', 'workspace', 'public').required(),
    inviteEmails: Joi.array().items(Joi.string().email({ tlds: { allow: false } })).default([]),
    publish: Joi.boolean().optional(),
  });

  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  const detail = getGuideForUser({ user: req.user, guideId: req.params.guideId });
  if (!detail) return res.status(404).json({ success: false, message: 'Guide not found' });
  if (detail.guide.owner_user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Only owner can change sharing settings' });
  }

  const result = shareGuideSettings({
    guideId: req.params.guideId,
    userId: req.user.id,
    shareType: value.shareType,
    inviteEmails: value.inviteEmails,
    publish: value.publish,
  });

  if (!result) return res.status(404).json({ success: false, message: 'Guide not found' });

  const baseOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5175';
  const shareUrl = result.share.share_type === 'public' && result.share.public_slug
    ? `${baseOrigin}/guides/shared/${result.share.public_slug}`
    : `${baseOrigin}/guides/${result.guide.id}`;

  return res.json({
    success: true,
    guide: result.guide,
    share: result.share,
    share_url: shareUrl,
  });
});

router.post('/:guideId/view', requireAuth, (req, res) => {
  const found = getGuideForUser({ user: req.user, guideId: req.params.guideId, shareToken: req.body?.shareToken || null });
  if (!found) return res.status(404).json({ success: false, message: 'Guide not found' });
  if (found.forbidden) return res.status(403).json({ success: false, message: 'You do not have access to this guide' });

  const views = incrementGuideView({ guideId: req.params.guideId, userId: req.user.id });
  return res.json({ success: true, views });
});

router.post('/:guideId/duplicate', requireAuth, (req, res) => {
  const found = getGuideForUser({ user: req.user, guideId: req.params.guideId });
  if (!found) return res.status(404).json({ success: false, message: 'Guide not found' });
  if (found.forbidden) return res.status(403).json({ success: false, message: 'You do not have access to this guide' });

  const duplicated = duplicateGuide({ guideId: req.params.guideId, userId: req.user.id });
  if (!duplicated) return res.status(404).json({ success: false, message: 'Guide not found' });

  return res.status(201).json({ success: true, guide: duplicated });
});

router.delete('/:guideId', requireAuth, (req, res) => {
  const result = deleteGuide({ guideId: req.params.guideId, userId: req.user.id });
  if (!result) return res.status(404).json({ success: false, message: 'Guide not found' });
  if (result.forbidden) return res.status(403).json({ success: false, message: 'Only owner can delete guide' });
  return res.json({ success: true });
});

// ─── Guide video ─────────────────────────────────────────────────────────────

router.post('/:guideId/video/youtube', requireAuth, (req, res) => {
  const schema = Joi.object({
    url: Joi.string().uri().required(),
  });
  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  const found = getGuideForUser({ user: req.user, guideId: req.params.guideId });
  if (!found) return res.status(404).json({ success: false, message: 'Guide not found' });
  if (found.forbidden) return res.status(403).json({ success: false, message: 'Access denied' });
  if (found.guide.owner_user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Only owner can add video' });
  }

  const ytMatch = value.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (!ytMatch) return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });

  const videoId = ytMatch[1];
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  const updated = updateGuide({
    guideId: req.params.guideId,
    userId: req.user.id,
    patch: { video_type: 'youtube', video_url: value.url, embed_url: embedUrl },
  });
  if (!updated) return res.status(404).json({ success: false, message: 'Guide not found' });

  return res.json({
    success: true,
    videoType: 'youtube',
    videoUrl: value.url,
    embedUrl,
    thumbnailUrl,
  });
});

// ─── Guide-specific recording ─────────────────────────────────────────────────

router.post('/:guideId/record/start', requireAuth, (req, res) => {
  const found = getGuideForUser({ user: req.user, guideId: req.params.guideId });
  if (!found) return res.status(404).json({ success: false, message: 'Guide not found' });
  if (found.forbidden) return res.status(403).json({ success: false, message: 'Access denied' });

  const session = startGuideRecording(req.params.guideId, req.user.id);
  if (!session) return res.status(404).json({ success: false, message: 'Guide not found' });
  return res.status(201).json({ success: true, session });
});

router.post('/:guideId/record/finish', requireAuth, (req, res) => {
  const { sessionId } = req.body || {};
  const guide = finishGuideRecording(sessionId || null, req.params.guideId, req.user.id);
  if (!guide) return res.status(404).json({ success: false, message: 'Guide not found' });
  const found = getGuideForUser({ user: req.user, guideId: req.params.guideId });
  return res.json({ success: true, guide: found?.guide || guide, steps: found?.steps || [] });
});

router.post('/:guideId/record/cancel', requireAuth, (req, res) => {
  finishGuideRecording(req.body?.sessionId || null, req.params.guideId, req.user.id);
  return res.json({ success: true });
});

// ─── Step CRUD ────────────────────────────────────────────────────────────────

router.post('/:guideId/steps', requireAuth, (req, res) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(1).max(140).required(),
    description: Joi.string().allow('').max(2000).default(''),
    screenshot_url: Joi.string().uri().allow(null, '').optional(),
    action_type: Joi.string().trim().max(80).default('action'),
    video_timestamp_seconds: Joi.number().integer().min(0).allow(null).optional(),
  });

  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  const found = getGuideForUser({ user: req.user, guideId: req.params.guideId });
  if (!found) return res.status(404).json({ success: false, message: 'Guide not found' });
  if (found.forbidden) return res.status(403).json({ success: false, message: 'Access denied' });

  const step = appendGuideStep(req.params.guideId, {
    title: value.title,
    description: value.description,
    screenshotUrl: value.screenshot_url || null,
    actionType: value.action_type,
    video_timestamp_seconds: value.video_timestamp_seconds ?? null,
  });

  return res.status(201).json({ success: true, step });
});

router.patch('/:guideId/steps/:stepId', requireAuth, (req, res) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(1).max(140).optional(),
    description: Joi.string().allow('').max(2000).optional(),
    screenshot_url: Joi.string().uri().allow(null, '').optional(),
    video_timestamp_seconds: Joi.number().integer().min(0).allow(null).optional(),
  }).min(1);

  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  const result = updateGuideStep(req.params.guideId, req.params.stepId, req.user.id, value);
  if (!result) return res.status(404).json({ success: false, message: 'Step not found' });
  if (result.forbidden) return res.status(403).json({ success: false, message: 'Only owner can edit steps' });

  return res.json({ success: true, step: result });
});

router.delete('/:guideId/steps/:stepId', requireAuth, (req, res) => {
  const result = deleteGuideStep(req.params.guideId, req.params.stepId, req.user.id);
  if (!result) return res.status(404).json({ success: false, message: 'Step not found' });
  if (result.forbidden) return res.status(403).json({ success: false, message: 'Only owner can delete steps' });
  return res.json({ success: true });
});

module.exports = router;
