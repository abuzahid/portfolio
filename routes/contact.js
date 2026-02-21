const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { sendContactEmail } = require('../services/mailer');

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many submissions. Please try again later.' },
});

router.post(
  '/',
  contactLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required').escape(),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('subject').trim().notEmpty().withMessage('Subject is required').escape(),
    body('message').trim().notEmpty().withMessage('Message is required').escape(),
    body('honeypot').custom((value) => {
      if (value) throw new Error('Bot detected');
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const { name, email, subject, message } = req.body;
      await sendContactEmail({ name, email, subject, message });
      res.json({ success: true, message: 'Message sent successfully!' });
    } catch (err) {
      console.error('Email error:', err);
      res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
    }
  }
);

module.exports = router;
