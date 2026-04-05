const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { usersById, createWorkspace } = require('../db/store');

const router = express.Router();

const createTeamSchema = Joi.object({
  team_name: Joi.string().trim().min(2).max(120).required(),
});

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

router.post('/create', requireAuth, (req, res) => {
  const { error, value } = createTeamSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
  }

  if (req.user.status === 'rejected' || req.user.status === 'blocked') {
    return res.status(403).json({ success: false, message: 'Account is blocked' });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({ success: false, message: 'Verify your email before creating a workspace' });
  }

  if (req.user.workspace_id) {
    return res.status(409).json({ success: false, message: 'Workspace already exists' });
  }

  const workspace = createWorkspace(req.user.id, value.team_name);
  return res.status(201).json({ success: true, workspace });
});

module.exports = router;
