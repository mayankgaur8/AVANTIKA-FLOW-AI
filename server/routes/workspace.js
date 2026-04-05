const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const {
  usersById,
  workspaces,
  getWorkspaceMembers,
  getMemberRole,
  updateMemberRole,
  removeMember,
  inviteMember,
  getPendingInvites,
  getWorkspaceGuides,
  getWorkspaceActivity,
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

const requireWorkspace = (req, res, next) => {
  if (!req.user.workspace_id) {
    return res.status(409).json({ success: false, message: 'Create a workspace first' });
  }
  req.workspace = workspaces.get(req.user.workspace_id) || null;
  if (!req.workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }
  return next();
};

// ─── GET /api/workspace ───────────────────────────────────────────────────────
// Full workspace bootstrap: members + guides + activity + pending invites

router.get('/', requireAuth, requireWorkspace, (req, res) => {
  const workspaceId = req.workspace.id;
  const members = getWorkspaceMembers(workspaceId);
  const guides = getWorkspaceGuides(workspaceId);
  const activity = getWorkspaceActivity(workspaceId);
  const invites = getPendingInvites(workspaceId);
  const myRole = getMemberRole(workspaceId, req.user.id) || 'viewer';

  return res.json({
    success: true,
    workspace: req.workspace,
    members,
    guides,
    activity,
    pendingInvites: invites,
    myRole,
  });
});

// ─── GET /api/workspace/members ───────────────────────────────────────────────

router.get('/members', requireAuth, requireWorkspace, (req, res) => {
  const members = getWorkspaceMembers(req.workspace.id);
  const myRole = getMemberRole(req.workspace.id, req.user.id) || 'viewer';
  return res.json({ success: true, members, myRole });
});

// ─── POST /api/workspace/invite ───────────────────────────────────────────────

router.post('/invite', requireAuth, requireWorkspace, (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    role: Joi.string().valid('admin', 'editor', 'viewer').default('editor'),
  });
  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  const result = inviteMember(req.workspace.id, value.email, value.role, req.user.id);
  if (!result) return res.status(404).json({ success: false, message: 'Member not found' });
  if (result.forbidden) return res.status(403).json({ success: false, message: 'Only admins can invite members' });
  if (result.error) return res.status(409).json({ success: false, message: result.error });

  return res.status(201).json({ success: true, ...result });
});

// ─── PATCH /api/workspace/members/:userId ─────────────────────────────────────

router.patch('/members/:userId', requireAuth, requireWorkspace, (req, res) => {
  const schema = Joi.object({
    role: Joi.string().valid('admin', 'editor', 'viewer').required(),
  });
  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  const result = updateMemberRole(req.workspace.id, req.params.userId, value.role, req.user.id);
  if (!result) return res.status(404).json({ success: false, message: 'Member not found' });
  if (result.forbidden) return res.status(403).json({ success: false, message: 'Only admins can change roles' });
  if (result.error) return res.status(400).json({ success: false, message: result.error });

  return res.json({ success: true, member: result });
});

// ─── DELETE /api/workspace/members/:userId ────────────────────────────────────

router.delete('/members/:userId', requireAuth, requireWorkspace, (req, res) => {
  const result = removeMember(req.workspace.id, req.params.userId, req.user.id);
  if (!result) return res.status(404).json({ success: false, message: 'Member not found' });
  if (result.forbidden) return res.status(403).json({ success: false, message: 'Only admins can remove members' });
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  return res.json({ success: true });
});

// ─── GET /api/workspace/guides ────────────────────────────────────────────────

router.get('/guides', requireAuth, requireWorkspace, (req, res) => {
  const guides = getWorkspaceGuides(req.workspace.id);
  return res.json({ success: true, guides });
});

// ─── GET /api/workspace/activity ─────────────────────────────────────────────

router.get('/activity', requireAuth, requireWorkspace, (req, res) => {
  const activity = getWorkspaceActivity(req.workspace.id);
  return res.json({ success: true, activity });
});

module.exports = router;
