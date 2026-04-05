const express = require('express');
const Joi = require('joi');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { salesInquiries, demoRequests } = require('../db/store');

const router = express.Router();

const salesInquirySchema = Joi.object({
  full_name: Joi.string().max(255).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  company: Joi.string().max(255).allow('', null).optional(),
  team_size: Joi.string().max(100).allow('', null).optional(),
  role: Joi.string().max(120).allow('', null).optional(),
  interest_area: Joi.string().max(120).allow('', null).optional(),
  message: Joi.string().max(2500).required(),
  source_page: Joi.string().max(255).allow('', null).optional(),
  cta_clicked: Joi.string().max(255).allow('', null).optional(),
  campaign_source: Joi.string().max(255).allow('', null).optional(),
});

const demoRequestSchema = Joi.object({
  full_name: Joi.string().max(255).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  company: Joi.string().max(255).allow('', null).optional(),
  message: Joi.string().max(2000).allow('', null).optional(),
  source_page: Joi.string().max(255).allow('', null).optional(),
});

const contactSchema = Joi.object({
  full_name: Joi.string().max(255).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  subject: Joi.string().max(255).allow('', null).optional(),
  message: Joi.string().max(3000).required(),
  source_page: Joi.string().max(255).allow('', null).optional(),
});

const createTransport = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
};

const sendInquiryEmails = async (inquiry) => {
  const transporter = createTransport();
  const salesInbox = process.env.SALES_INBOX_EMAIL || process.env.SMTP_USER;
  if (!transporter || !salesInbox) {
    console.log('[sales-inquiry] Notification email skipped: SMTP not configured');
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || salesInbox,
    to: salesInbox,
    subject: `New sales inquiry from ${inquiry.full_name}`,
    text: [
      `Name: ${inquiry.full_name}`,
      `Email: ${inquiry.email}`,
      `Company: ${inquiry.company || '-'}`,
      `Role: ${inquiry.role || '-'}`,
      `Team size: ${inquiry.team_size || '-'}`,
      `Interest: ${inquiry.interest_area || '-'}`,
      `Source page: ${inquiry.source_page || '-'}`,
      `CTA: ${inquiry.cta_clicked || '-'}`,
      '',
      `Message:\n${inquiry.message}`,
    ].join('\n'),
  });

  if (process.env.ENABLE_AUTO_REPLY === 'true') {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || salesInbox,
      to: inquiry.email,
      subject: 'We received your Avantika Flow AI inquiry',
      text: `Hi ${inquiry.full_name},\n\nThanks for reaching out. Our team will get back to you shortly.\n\n- Avantika Flow AI`,
    });
  }
};

router.post('/sales-inquiry', async (req, res) => {
  const { error, value } = salesInquirySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
  }

  const id = uuidv4();
  const inquiry = {
    id,
    ...value,
    created_at: new Date().toISOString(),
  };

  salesInquiries.set(id, inquiry);

  try {
    await sendInquiryEmails(inquiry);
  } catch (mailError) {
    console.error('[sales-inquiry] Email notification failed:', mailError);
  }

  return res.status(201).json({
    success: true,
    message: 'Inquiry submitted successfully',
    inquiry,
  });
});

router.post('/demo-request', (req, res) => {
  const { error, value } = demoRequestSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
  }

  const id = uuidv4();
  const request = {
    id,
    ...value,
    created_at: new Date().toISOString(),
  };

  demoRequests.set(id, request);

  return res.status(201).json({
    success: true,
    message: 'Demo request received',
    request,
  });
});

router.post('/contact', async (req, res) => {
  const { error, value } = contactSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: error.details.map((d) => d.message),
    });
  }

  const id = uuidv4();
  const contact = { id, ...value, created_at: new Date().toISOString() };

  // Re-use salesInquiries store for contact messages
  salesInquiries.set(id, { ...contact, type: 'contact' });

  const transporter = createTransport();
  const inbox = process.env.SALES_INBOX_EMAIL || process.env.SMTP_USER;
  if (transporter && inbox) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || inbox,
        to: inbox,
        subject: `Contact form: ${value.subject || 'General inquiry'} from ${value.full_name}`,
        text: [`Name: ${value.full_name}`, `Email: ${value.email}`, `Subject: ${value.subject || '-'}`, '', value.message].join('\n'),
      });
    } catch (mailErr) {
      console.error('[contact] Email failed:', mailErr);
    }
  }

  return res.status(201).json({ success: true, message: 'Message received', contact });
});

module.exports = router;
