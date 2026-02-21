const express = require('express');
const { requireAuth, login, logout, loginLimiter } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { readJSON, writeJSON, nextId, slugify } = require('../services/dataStore');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Login page
router.get('/login', (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin/dashboard');
  res.render('admin/login', { error: null });
});

// Login action
router.post('/login', loginLimiter, login);

// Logout
router.post('/logout', requireAuth, logout);

// Dashboard
router.get('/dashboard', requireAuth, (req, res) => {
  const projects = readJSON('projects.json');
  const blogs = readJSON('blogs.json');
  res.render('admin/dashboard', {
    projectCount: projects.projects.length,
    blogCount: blogs.blogs.length,
  });
});

// ========== PROJECTS ==========

// List projects
router.get('/projects', requireAuth, (req, res) => {
  const data = readJSON('projects.json');
  res.render('admin/projects', { projects: data.projects });
});

// New project form
router.get('/projects/new', requireAuth, (req, res) => {
  res.render('admin/project-form', { project: null });
});

// Create project
router.post('/projects', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const data = readJSON('projects.json');
    const newProject = {
      id: nextId(data.projects),
      title: req.body.title || '',
      description: req.body.description || '',
      category: req.body.category || '',
      tags: req.body.tags ? req.body.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      image: req.file ? '/assets/images/projects/' + req.file.filename : '',
      link: req.body.link || '',
      date: req.body.date || new Date().getFullYear().toString(),
      featured: req.body.featured === 'on',
    };
    data.projects.push(newProject);
    await writeJSON('projects.json', data);
    res.redirect('/admin/projects');
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).send('Error creating project');
  }
});

// Edit project form
router.get('/projects/:id/edit', requireAuth, (req, res) => {
  const data = readJSON('projects.json');
  const project = data.projects.find((p) => p.id === parseInt(req.params.id));
  if (!project) return res.status(404).send('Project not found');
  res.render('admin/project-form', { project });
});

// Update project
router.post('/projects/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const data = readJSON('projects.json');
    const idx = data.projects.findIndex((p) => p.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).send('Project not found');

    const existing = data.projects[idx];

    // Delete old image if a new one is uploaded
    if (req.file && existing.image) {
      const oldPath = path.join(__dirname, '..', 'public', existing.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    data.projects[idx] = {
      ...existing,
      title: req.body.title || existing.title,
      description: req.body.description || existing.description,
      category: req.body.category || existing.category,
      tags: req.body.tags ? req.body.tags.split(',').map((t) => t.trim()).filter(Boolean) : existing.tags,
      image: req.file ? '/assets/images/projects/' + req.file.filename : existing.image,
      link: req.body.link !== undefined ? req.body.link : existing.link,
      date: req.body.date || existing.date,
      featured: req.body.featured === 'on',
    };

    await writeJSON('projects.json', data);
    res.redirect('/admin/projects');
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).send('Error updating project');
  }
});

// Delete project
router.post('/projects/:id/delete', requireAuth, async (req, res) => {
  try {
    const data = readJSON('projects.json');
    const idx = data.projects.findIndex((p) => p.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).send('Project not found');

    // Delete image file
    const project = data.projects[idx];
    if (project.image) {
      const imgPath = path.join(__dirname, '..', 'public', project.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    data.projects.splice(idx, 1);
    await writeJSON('projects.json', data);
    res.redirect('/admin/projects');
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).send('Error deleting project');
  }
});

// ========== BLOGS ==========

// List blogs
router.get('/blogs', requireAuth, (req, res) => {
  const data = readJSON('blogs.json');
  res.render('admin/blogs', { blogs: data.blogs });
});

// New blog form
router.get('/blogs/new', requireAuth, (req, res) => {
  res.render('admin/blog-form', { blog: null });
});

// Create blog
router.post('/blogs', requireAuth, async (req, res) => {
  try {
    const data = readJSON('blogs.json');
    const newBlog = {
      id: nextId(data.blogs),
      title: req.body.title || '',
      description: req.body.description || '',
      slug: slugify(req.body.title || 'untitled'),
      content: req.body.content || '',
      url: req.body.url || '',
      date: req.body.date || new Date().getFullYear().toString(),
      tags: req.body.tags ? req.body.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      published: req.body.published === 'on',
    };
    data.blogs.push(newBlog);
    await writeJSON('blogs.json', data);
    res.redirect('/admin/blogs');
  } catch (err) {
    console.error('Create blog error:', err);
    res.status(500).send('Error creating blog');
  }
});

// Edit blog form
router.get('/blogs/:id/edit', requireAuth, (req, res) => {
  const data = readJSON('blogs.json');
  const blog = data.blogs.find((b) => b.id === parseInt(req.params.id));
  if (!blog) return res.status(404).send('Blog not found');
  res.render('admin/blog-form', { blog });
});

// Update blog
router.post('/blogs/:id', requireAuth, async (req, res) => {
  try {
    const data = readJSON('blogs.json');
    const idx = data.blogs.findIndex((b) => b.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).send('Blog not found');

    const existing = data.blogs[idx];
    data.blogs[idx] = {
      ...existing,
      title: req.body.title || existing.title,
      description: req.body.description || existing.description,
      slug: slugify(req.body.title || existing.title),
      content: req.body.content !== undefined ? req.body.content : existing.content,
      url: req.body.url !== undefined ? req.body.url : existing.url,
      date: req.body.date || existing.date,
      tags: req.body.tags ? req.body.tags.split(',').map((t) => t.trim()).filter(Boolean) : existing.tags,
      published: req.body.published === 'on',
    };

    await writeJSON('blogs.json', data);
    res.redirect('/admin/blogs');
  } catch (err) {
    console.error('Update blog error:', err);
    res.status(500).send('Error updating blog');
  }
});

// Delete blog
router.post('/blogs/:id/delete', requireAuth, async (req, res) => {
  try {
    const data = readJSON('blogs.json');
    const idx = data.blogs.findIndex((b) => b.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).send('Blog not found');

    data.blogs.splice(idx, 1);
    await writeJSON('blogs.json', data);
    res.redirect('/admin/blogs');
  } catch (err) {
    console.error('Delete blog error:', err);
    res.status(500).send('Error deleting blog');
  }
});

module.exports = router;
