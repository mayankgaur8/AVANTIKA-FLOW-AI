const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { usersById } = require('../db/store');

const router = express.Router();

// ─── Image upload ─────────────────────────────────────────────────────────────

const uploadsRoot = path.join(__dirname, '..', 'uploads', 'guides');
fs.mkdirSync(uploadsRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext) ? ext : '.png';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
      cb(new Error('Only image uploads are allowed'));
      return;
    }
    cb(null, true);
  },
});

// ─── Video upload ─────────────────────────────────────────────────────────────

const videosRoot = path.join(__dirname, '..', 'uploads', 'videos');
fs.mkdirSync(videosRoot, { recursive: true });

const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/x-matroska'];

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, videosRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.mp4', '.webm', '.mov', '.ogg', '.mkv'].includes(ext) ? ext : '.webm';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
  },
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_VIDEO_MIMES.includes(file.mimetype)) {
      cb(new Error('Only video files (mp4, webm, mov) are allowed'));
      return;
    }
    cb(null, true);
  },
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

router.post('/image', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded' });
  }

  const serverBase = process.env.SERVER_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const url = `${serverBase}/uploads/guides/${req.file.filename}`;

  return res.status(201).json({
    success: true,
    url,
    filename: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });
});

router.post('/video', requireAuth, (req, res, next) => {
  uploadVideo.single('video')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'Video file too large (max 500 MB)' });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Video upload failed' });
    }
    next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No video file uploaded' });
  }

  const serverBase = process.env.SERVER_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const videoUrl = `${serverBase}/uploads/videos/${req.file.filename}`;

  return res.status(201).json({
    success: true,
    videoType: 'uploaded',
    videoUrl,
    thumbnailUrl: null,
    durationSeconds: null,
  });
});

module.exports = router;
