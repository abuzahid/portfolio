const express = require('express');
const { marked } = require('marked');
const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify');
const { readJSON } = require('../services/dataStore');

const router = express.Router();

// Create DOMPurify instance
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// CSRF token endpoint for contact form
router.get('/api/csrf-token', (req, res) => {
  // Using session-based token
  if (!req.session.csrfToken) {
    req.session.csrfToken = require('crypto').randomBytes(32).toString('hex');
  }
  res.json({ token: req.session.csrfToken });
});

// Blog post page
router.get('/blog/:slug', (req, res) => {
  try {
    const data = readJSON('blogs.json');
    const blog = data.blogs.find((b) => b.slug === req.params.slug && b.published !== false);

    if (!blog) {
      return res.status(404).send('Blog post not found');
    }

    const htmlContent = purify.sanitize(marked(blog.content || ''));

    res.render('blog/post', { blog, htmlContent });
  } catch (err) {
    console.error('Blog error:', err);
    res.status(500).send('Error loading blog post');
  }
});

module.exports = router;
