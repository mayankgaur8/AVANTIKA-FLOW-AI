const express = require('express');
const nodemailer = require('nodemailer');
const { patchUser, usersById } = require('../db/store');

const router = express.Router();

const adminSecret = process.env.ADMIN_SECRET || 'dev-admin-secret';
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5175';

const createTransport = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
};

const sendApprovalDecisionEmail = async (user, decision) => {
  const transporter = createTransport();
  const from = process.env.SMTP_FROM || process.env.SALES_INBOX_EMAIL || process.env.ADMIN_EMAIL;
  if (!transporter || !from) return;

  const approved = decision === 'approved';
  await transporter.sendMail({
    from,
    to: user.email,
    subject: approved
      ? 'Your Avantika Flow AI access is approved'
      : 'Update on your Avantika Flow AI access request',
    text: approved
      ? `Hi ${user.name || 'there'},\n\nYour access has been approved. Continue setup: ${clientOrigin}/approval-success\n\n- Avantika Flow AI`
      : `Hi ${user.name || 'there'},\n\nWe are unable to approve access at this time. Contact support for help.\n\n- Avantika Flow AI`,
  });
};

const checkAdmin = (req, res, next) => {
  const supplied = req.headers['x-admin-secret'] || req.query.secret;
  if (!supplied || supplied !== adminSecret) {
    return res.status(401).json({ success: false, message: 'Admin authorization required' });
  }

  const expiresAt = req.query.expires ? Number(req.query.expires) : null;
  if (expiresAt && Number.isFinite(expiresAt) && Date.now() > expiresAt) {
    return res.status(410).json({ success: false, message: 'Approval link expired' });
  }

  return next();
};

const applyDecision = async (req, res, decision) => {
  const user = usersById.get(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (decision === 'approve') {
    const updated = patchUser(user.id, {
      status: 'approved',
      approved_at: new Date().toISOString(),
      rejected_at: null,
      rejection_reason: null,
    });
    sendApprovalDecisionEmail(updated, 'approved').catch((e) => {
      console.error('[admin/approve] email failed:', e);
    });
    return res.json({ success: true, user: updated, next: `${clientOrigin}/approval-success` });
  }

  const updated = patchUser(user.id, {
    status: 'rejected',
    rejected_at: new Date().toISOString(),
    rejection_reason: req.body?.reason || null,
  });
  sendApprovalDecisionEmail(updated, 'rejected').catch((e) => {
    console.error('[admin/reject] email failed:', e);
  });
  return res.json({ success: true, user: updated });
};

router.get('/users', checkAdmin, (req, res) => {
  const users = Array.from(usersById.values()).sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return res.json({ success: true, users });
});

router.post('/users/:id/approve', checkAdmin, async (req, res) => applyDecision(req, res, 'approve'));
router.post('/users/:id/reject', checkAdmin, async (req, res) => applyDecision(req, res, 'reject'));

// Convenience links for email actions
router.get('/users/:id/approve', checkAdmin, async (req, res) => {
  const result = await applyDecision(req, res, 'approve');
  if (!res.headersSent) return result;
  return undefined;
});
router.get('/users/:id/reject', checkAdmin, async (req, res) => {
  const result = await applyDecision(req, res, 'reject');
  if (!res.headersSent) return result;
  return undefined;
});

module.exports = router;
