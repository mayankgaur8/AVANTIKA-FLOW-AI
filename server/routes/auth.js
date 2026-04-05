const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const {
  usersByEmail,
  usersById,
  authSessions,
  upsertUser,
  patchUser,
} = require('../db/store');

const router = express.Router();

// ─── Config ──────────────────────────────────────────────────────────────────

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const VERIFICATION_TTL_MINUTES = parseInt(process.env.VERIFICATION_TOKEN_TTL_MINUTES || '60', 10);
const RESEND_COOLDOWN_SECONDS = parseInt(process.env.RESEND_VERIFICATION_COOLDOWN_SECONDS || '60', 10);

// When false (default), Google-authenticated emails are trusted as verified.
// Set to true to require our own email confirmation even for Google users.
const REQUIRE_EMAIL_VERIFICATION_FOR_GOOGLE =
  (process.env.REQUIRE_EMAIL_VERIFICATION_FOR_GOOGLE || 'false').toLowerCase() === 'true';

const oauthStateStore = new Map();

const googleClientId     = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl  = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5175/api/auth/google/callback';
const clientOrigin       = process.env.CLIENT_ORIGIN || 'http://localhost:5175';
// Used in verification email links — must be reachable from outside (not the proxy)
const serverBaseUrl      = process.env.SERVER_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

const oauthClient = googleClientId && googleClientSecret
  ? new OAuth2Client(googleClientId, googleClientSecret, googleCallbackUrl)
  : null;

// ─── Email ───────────────────────────────────────────────────────────────────

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

const sendVerificationEmail = async (user, rawToken) => {
  const verifyUrl = `${serverBaseUrl}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
  const from      = process.env.SMTP_FROM || process.env.SALES_INBOX_EMAIL || process.env.ADMIN_EMAIL;
  const transporter = createTransport();

  if (!transporter || !from) {
    // Dev fallback — log the link so developers can test without SMTP
    console.log(`\n[auth] ✉  Verification link for ${user.email}:\n  ${verifyUrl}\n`);
    return;
  }

  const displayName = user.name ? user.name.split(' ')[0] : 'there';

  await transporter.sendMail({
    from: `"Avantika Flow AI" <${from}>`,
    to: user.email,
    subject: 'Verify your Avantika Flow AI account',
    text: [
      `Hi ${displayName},`,
      '',
      'Please verify your email address to activate your Avantika Flow AI account.',
      '',
      `Verify email: ${verifyUrl}`,
      '',
      `This link expires in ${VERIFICATION_TTL_MINUTES} minutes.`,
      '',
      "If you didn't create an account, you can safely ignore this email.",
    ].join('\n'),
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <!-- Header -->
        <tr>
          <td style="padding:28px 32px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.2);display:inline-block;line-height:36px;text-align:center;font-weight:900;font-size:18px;color:white;">A</div>
                    <span style="font-size:18px;font-weight:800;color:white;">Avantika Flow AI</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 8px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Verify your email address</h1>
            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
              Hi ${displayName}, welcome to Avantika Flow AI! Click the button below to confirm your email and activate your account.
            </p>
            <a href="${verifyUrl}"
               style="display:inline-block;padding:14px 28px;border-radius:10px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;font-size:15px;font-weight:700;text-decoration:none;">
              Verify email →
            </a>
            <p style="margin:24px 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
              This link expires in <strong>${VERIFICATION_TTL_MINUTES} minutes</strong>.<br>
              Can't click the button? Copy and paste this link:
            </p>
            <p style="margin:0 0 24px;font-size:12px;color:#6b7280;word-break:break-all;background:#f9fafb;padding:10px;border-radius:8px;border:1px solid #e5e7eb;">
              ${verifyUrl}
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 28px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
              If you didn't create an Avantika Flow AI account, you can safely ignore this email.<br>
              © ${new Date().getFullYear()} Avantika Flow AI, Inc.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  console.log(`[auth] ✉  Verification email sent to ${user.email}`);
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const signToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Shape the user object returned to the frontend.
 * IMPORTANT: `provider` (not `auth_provider`) is what the frontend AuthUser expects.
 */
const safeUser = (u) => ({
  id:            u.id,
  name:          u.name,
  email:         u.email,
  provider:      u.auth_provider || 'email',   // frontend reads `provider`
  avatar_url:    u.avatar_url,
  status:        u.status,
  email_verified: !!u.email_verified,
  is_onboarded:  u.is_onboarded ?? false,       // frontend reads `is_onboarded`
  team_name:     u.team_name,
  workspace_id:  u.workspace_id,
  source_page:   u.source_page,
  cta_clicked:   u.cta_clicked,
  campaign_source: u.campaign_source,
  selected_use_case: u.selected_use_case,
  created_at:    u.created_at,
  updated_at:    u.updated_at,
});

const authStateFor = (user) => {
  if (!user) return 'anonymous';
  if (user.status === 'rejected' || user.status === 'blocked') return 'rejected_or_blocked';
  if (!user.email_verified) return 'email_verification_pending';
  if (user.is_onboarded === false) return 'onboarding_incomplete';
  if (!user.workspace_id) return 'email_verified_no_team';
  return 'email_verified_with_team';
};

const buildCallbackRedirect = ({ token, error, authState, sourcePage, provider, redirectTo, clientOriginOverride }) => {
  const url = new URL('/auth/callback', clientOriginOverride || clientOrigin);
  if (token)     url.searchParams.set('token', token);
  if (error)     url.searchParams.set('error', error);
  if (authState) url.searchParams.set('auth_state', authState);
  if (sourcePage) url.searchParams.set('source_page', sourcePage);
  if (provider)  url.searchParams.set('provider', provider);
  if (redirectTo) url.searchParams.set('redirect_to', redirectTo);
  return url.toString();
};

const createSession = (userId, provider = 'email') => {
  const sessionId = uuidv4();
  authSessions.set(sessionId, {
    id: sessionId,
    user_id: userId,
    provider,
    created_at: new Date().toISOString(),
  });
  return sessionId;
};

const generateVerificationToken = () => {
  const token    = crypto.randomBytes(32).toString('hex');
  const hash     = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MINUTES * 60 * 1000).toISOString();
  return { token, hash, expiresAt };
};

/**
 * Issue (or re-issue) a verification email for a user.
 * Returns { sent, reason? } so callers can decide how to respond.
 */
const issueVerification = async (user, { force = false } = {}) => {
  if (user.email_verified) return { sent: false, reason: 'already_verified' };

  if (!force && user.verification_sent_at) {
    const sentMs     = new Date(user.verification_sent_at).getTime();
    const cooldownMs = RESEND_COOLDOWN_SECONDS * 1000;
    if (Date.now() - sentMs < cooldownMs) {
      return { sent: false, reason: 'cooldown' };
    }
  }

  const { token, hash, expiresAt } = generateVerificationToken();
  const updated = patchUser(user.id, {
    verification_token_hash:       hash,
    verification_token_expires_at: expiresAt,
    verification_sent_at:          new Date().toISOString(),
  });

  try {
    await sendVerificationEmail(updated, token);
  } catch (err) {
    console.error('[auth] Failed to send verification email:', err.message);
    return { sent: false, reason: 'email_send_failed' };
  }

  return { sent: true };
};

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  try {
    const token   = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user    = usersById.get(decoded.sub);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// ─── Validation schemas ───────────────────────────────────────────────────────

const signupSchema = Joi.object({
  email:            Joi.string().email({ tlds: { allow: false } }).required(),
  password:         Joi.string().min(8).max(128).optional(),
  name:             Joi.string().max(255).allow('', null).optional(),
  source_page:      Joi.string().max(255).allow('', null).optional(),
  cta_clicked:      Joi.string().max(255).allow('', null).optional(),
  selected_use_case: Joi.string().max(255).allow('', null).optional(),
  campaign_source:  Joi.string().max(255).allow('', null).optional(),
});

const loginSchema = Joi.object({
  email:    Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/signup', async (req, res) => {
  try {
    const { error, value } = signupSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: error.details.map((d) => d.message) });
    }

    const email = value.email.toLowerCase();
    if (usersByEmail.has(email)) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const passwordHash = value.password ? await bcrypt.hash(value.password, 12) : null;
    const { user } = upsertUser({
      email,
      name:              value.name || null,
      auth_provider:     'email',
      password_hash:     passwordHash,
      source_page:       value.source_page || null,
      cta_clicked:       value.cta_clicked || null,
      campaign_source:   value.campaign_source || null,
      selected_use_case: value.selected_use_case || null,
      email_verified:    false,
      is_onboarded:      false,
    });

    console.log(`[auth] New email signup: ${user.email} (id: ${user.id})`);

    const result = await issueVerification(user, { force: true });
    if (!result.sent && result.reason === 'email_send_failed') {
      console.warn(`[auth] Verification email failed for ${user.email} — user created but email not delivered`);
    }

    const token = signToken(user.id);
    createSession(user.id, 'email');

    return res.status(201).json({
      success:    true,
      message:    'Account created. Verification email sent.',
      token,
      auth_state: authStateFor(user),
      user:       safeUser(user),
    });
  } catch (err) {
    console.error('[auth/signup] Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const user = usersByEmail.get(value.email.toLowerCase());
    if (!user || !user.password_hash) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(value.password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (!user.email_verified) {
      await issueVerification(user); // re-send if cooldown has passed
    }

    const token = signToken(user.id);
    createSession(user.id, 'email');

    return res.json({
      success:    true,
      token,
      auth_state: authStateFor(user),
      user:       safeUser(user),
    });
  } catch (err) {
    console.error('[auth/login] Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/google', (req, res) => {
  if (!oauthClient) {
    return res.status(500).json({ success: false, message: 'Google OAuth is not configured.' });
  }

  const stateId = uuidv4();
  oauthStateStore.set(stateId, {
    source_page:       req.query.source_page || null,
    cta_clicked:       req.query.cta_clicked || null,
    campaign_source:   req.query.campaign_source || null,
    selected_use_case: req.query.selected_use_case || null,
    redirect_to:       req.query.redirect_to || null,
    client_origin:     req.get('origin') || null,
    created_at:        Date.now(),
  });

  const authUrl = oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope:       ['openid', 'profile', 'email'],
    prompt:      'select_account',
    state:       stateId,
  });

  return res.redirect(authUrl);
});

router.get('/google/callback', async (req, res) => {
  if (!oauthClient) return res.redirect(buildCallbackRedirect({ error: 'google_not_configured' }));

  const { code, state, error: oauthError } = req.query;
  if (oauthError === 'access_denied') return res.redirect(buildCallbackRedirect({ error: 'access_denied' }));
  if (!code || !state)               return res.redirect(buildCallbackRedirect({ error: 'invalid_callback_params' }));

  const savedState = oauthStateStore.get(state);
  oauthStateStore.delete(state);
  if (!savedState || Date.now() - savedState.created_at > OAUTH_STATE_TTL_MS) {
    return res.redirect(buildCallbackRedirect({ error: 'oauth_state_expired' }));
  }

  try {
    const tokenResponse = await oauthClient.getToken(String(code));
    oauthClient.setCredentials(tokenResponse.tokens);

    if (!tokenResponse.tokens.id_token) {
      return res.redirect(buildCallbackRedirect({ error: 'missing_id_token' }));
    }

    const ticket  = await oauthClient.verifyIdToken({ idToken: tokenResponse.tokens.id_token, audience: googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.redirect(buildCallbackRedirect({ error: 'google_email_missing' }));

    // Determine whether we trust Google's email verification
    // REQUIRE_EMAIL_VERIFICATION_FOR_GOOGLE=false (default) → skip app verification
    const googleVerifiedEmail = payload.email_verified === true;
    const skipAppVerification = !REQUIRE_EMAIL_VERIFICATION_FOR_GOOGLE || googleVerifiedEmail;

    const existingUser = usersByEmail.get(payload.email.toLowerCase());

    const { user, isNew } = upsertUser({
      email:             payload.email,
      name:              payload.name || null,
      auth_provider:     'google',
      provider_id:       payload.sub || null,
      avatar_url:        payload.picture || null,
      source_page:       savedState.source_page || null,
      cta_clicked:       savedState.cta_clicked || null,
      campaign_source:   savedState.campaign_source || null,
      selected_use_case: savedState.selected_use_case || null,
      // Trust Google verification unless explicitly required to do our own
      email_verified:    skipAppVerification ? true : (existingUser?.email_verified || false),
      is_onboarded:      existingUser?.is_onboarded ?? false,
    });

    console.log(`[auth] Google ${isNew ? 'signup' : 'login'}: ${user.email} | email_verified=${user.email_verified} | is_onboarded=${user.is_onboarded}`);

    // Send verification email only if our app-level verification is required
    if (!skipAppVerification && !user.email_verified) {
      await issueVerification(user, { force: isNew });
    }

    const token = signToken(user.id);
    createSession(user.id, 'google');

    return res.redirect(buildCallbackRedirect({
      token,
      authState:            authStateFor(user),
      sourcePage:           String(savedState.source_page || ''),
      provider:             'google',
      redirectTo:           String(savedState.redirect_to || ''),
      clientOriginOverride: savedState.client_origin || undefined,
    }));
  } catch (err) {
    console.error('[auth/google/callback] Error:', err);
    return res.redirect(buildCallbackRedirect({ error: 'google_auth_failed' }));
  }
});

// GET /api/auth/verify-email?token=...
// Validates the token, activates the account, then redirects to the frontend
// with both a status and a JWT so the user is immediately logged in.
router.get('/verify-email', (req, res) => {
  const rawToken = req.query.token;
  if (!rawToken || typeof rawToken !== 'string') {
    return res.redirect(`${clientOrigin}/email-verified-success?status=invalid_token`);
  }

  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const user = Array.from(usersById.values()).find((u) => u.verification_token_hash === hash);

  if (!user) {
    return res.redirect(`${clientOrigin}/email-verified-success?status=invalid_token`);
  }

  if (user.email_verified) {
    // Already verified — still issue a token so they can continue
    const jwtToken = signToken(user.id);
    return res.redirect(`${clientOrigin}/email-verified-success?status=already_verified&token=${encodeURIComponent(jwtToken)}`);
  }

  if (!user.verification_token_expires_at || new Date(user.verification_token_expires_at).getTime() < Date.now()) {
    return res.redirect(`${clientOrigin}/email-verified-success?status=expired_token`);
  }

  // Activate the account
  patchUser(user.id, {
    email_verified:                true,
    verification_token_hash:       null,
    verification_token_expires_at: null,
  });

  console.log(`[auth] ✓ Email verified: ${user.email}`);

  // Issue a fresh JWT so the frontend can immediately authenticate
  const jwtToken = signToken(user.id);
  createSession(user.id, user.auth_provider || 'email');

  return res.redirect(
    `${clientOrigin}/email-verified-success?status=verified&token=${encodeURIComponent(jwtToken)}`
  );
});

// POST /api/auth/resend-verification
router.post('/resend-verification', requireAuth, async (req, res) => {
  try {
    if (req.user.email_verified) {
      return res.json({ success: true, message: 'Email already verified' });
    }

    const result = await issueVerification(req.user);

    if (!result.sent && result.reason === 'cooldown') {
      return res.status(429).json({
        success: false,
        message: `Please wait ${RESEND_COOLDOWN_SECONDS} seconds before resending.`,
      });
    }

    if (!result.sent && result.reason === 'email_send_failed') {
      return res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again.' });
    }

    return res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    console.error('[auth/resend-verification] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to resend verification email' });
  }
});

// POST /api/auth/change-pending-email
// Allows an unverified user to correct their email address.
router.post('/change-pending-email', requireAuth, async (req, res) => {
  try {
    const schema = Joi.object({ email: Joi.string().email({ tlds: { allow: false } }).required() });
    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (req.user.email_verified) {
      return res.status(400).json({ success: false, message: 'Your email is already verified.' });
    }

    const newEmail = value.email.toLowerCase();
    if (newEmail === req.user.email) {
      return res.status(400).json({ success: false, message: 'That is already your current email.' });
    }

    const conflict = usersByEmail.get(newEmail);
    if (conflict && conflict.id !== req.user.id) {
      return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
    }

    // Remove old email key from the map before changing
    usersByEmail.delete(req.user.email);

    const updated = patchUser(req.user.id, {
      email:                         newEmail,
      verification_token_hash:       null,
      verification_token_expires_at: null,
      verification_sent_at:          null,
    });
    // Re-index under new email
    usersByEmail.set(newEmail, updated);

    console.log(`[auth] Email change pending: ${req.user.email} → ${newEmail}`);

    const result = await issueVerification(updated, { force: true });
    if (!result.sent) {
      console.warn(`[auth] Verification email failed after email change for ${newEmail}`);
    }

    return res.json({
      success: true,
      message: 'Email updated. Verification email sent to new address.',
      user:    safeUser(updated),
    });
  } catch (err) {
    console.error('[auth/change-pending-email] Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  return res.json({
    success:    true,
    auth_state: authStateFor(req.user),
    user:       safeUser(req.user),
  });
});

module.exports = router;
module.exports.requireAuth = requireAuth;
