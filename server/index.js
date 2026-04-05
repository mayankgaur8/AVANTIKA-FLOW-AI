const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const onboardingRoutes = require('./routes/onboarding');
const authRoutes = require('./routes/auth');
const salesRoutes = require('./routes/sales');
const adminRoutes = require('./routes/admin');
const teamRoutes = require('./routes/team');
const dashboardRoutes = require('./routes/dashboard');
const guidesRoutes = require('./routes/guides');
const uploadsRoutes = require('./routes/uploads');
const workspaceRoutes = require('./routes/workspace');
const sopRoutes = require('./routes/sop');
const workflowRoutes = require('./routes/workflow');
const itRoutes = require('./routes/it');
const financeRoutes = require('./routes/finance');
const customerRoutes = require('./routes/customer');
const hrRoutes = require('./routes/hr');
const actionsRoutes = require('./routes/actions');
const platformRoutes = require('./routes/platform');
const discoverRoutes = require('./routes/discover');
const resourcesRoutes = require('./routes/resources');
const homeRoutes = require('./routes/home');

// ─── App setup ───────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = (process.env.NODE_ENV || 'development') === 'production';

// ─── Security middleware ──────────────────────────────────────────────────────

app.use(helmet());

const defaultOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];
const envOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);

app.use(cors({
  origin: (origin, callback) => {
    const isLocalhostDevOrigin = typeof origin === 'string' && /^http:\/\/localhost:\d+$/.test(origin);
    if (!origin || allowedOrigins.has(origin) || isLocalhostDevOrigin) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
  max:      parseInt(process.env.RATE_LIMIT_MAX       || (isProduction ? '100' : '5000'), 10),
  skip: (req) => {
    if (isProduction) return false;
    return req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1';
  },
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || (isProduction ? '20' : '500'), 10),
  skip: (req) => {
    if (isProduction) return false;
    const isLocalIp = req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1';
    const isGoogleOAuthPath = req.path.startsWith('/google');
    return isLocalIp && isGoogleOAuthPath;
  },
  message: { success: false, message: 'Too many auth attempts. Please wait 15 minutes.' },
});

// ─── Body parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1d' }));

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/', (_req, res) => res.json({
  success: true,
  message: 'Avantika Flow AI backend is running',
  docs: {
    health: '/health',
    googleAuthStart: '/api/auth/google',
    googleAuthCallback: '/api/auth/google/callback',
  },
}));

app.get('/health', (_req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  env: process.env.NODE_ENV || 'development',
}));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/onboarding', onboardingRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', salesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/guides', guidesRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/sop', sopRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/it', itRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/home', homeRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ─── Global error handler ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
  const maskedGoogleClientId = googleClientId ? `${googleClientId.slice(0, 10)}...` : '(missing)';

  console.log(`\n🚀  Avantika Flow AI server running`);
  console.log(`    Local:  http://localhost:${PORT}`);
  console.log(`    Health: http://localhost:${PORT}/health\n`);
  console.log(`    GOOGLE_CLIENT_ID: ${maskedGoogleClientId}`);
  console.log(`    GOOGLE_CALLBACK_URL: ${process.env.GOOGLE_CALLBACK_URL || '(default http://localhost:3001/api/auth/google/callback)'}`);
  console.log(`    CLIENT_ORIGIN: ${process.env.CLIENT_ORIGIN || '(default http://localhost:5173)'}\n`);
});

module.exports = app;
