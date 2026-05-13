const express = require('express');
const Blog = require('../models/blog');
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs/promises');
const sanitizeHtml = require('sanitize-html');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const isValid = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(isValid ? null : new Error('Only image files are allowed'), isValid);
  }
});

// Wrapper to handle multer errors
const handleMulterError = (uploadFunc) => {
  return (req, res, next) => {
    uploadFunc(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 2MB.' });
        }
        return res.status(400).json({ error: 'File upload error: ' + err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
};

// Sanitization options for rich content
const sanitizeOptions = {
  allowedTags: ['b','i','em','strong','a','p','ul','ol','li','br','img','h1','h2','h3','pre','code'],
  allowedAttributes: {
    a: ['href','name','target','rel'],
    img: ['src','alt','title']
  },
  allowedSchemes: ['http', 'https', 'data', 'mailto']
};

const safeDeleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    // Ignore missing files
  }
};

router.get('/', (req, res) => {
  Blog.find().then((result) => {
    res.render('index', { title: 'Blogs', blogs: result });
  }).catch((err) => {
    console.log(err);
    res.status(500).send('Server error');
  });
});

router.get('/create', (req, res) => {
  res.render('create', { title: 'Create blog' });
});

// Whoami endpoint for client-side fallback (requires auth token)
router.get('/whoami', authMiddleware, (req, res) => {
  res.json({ userId: req.user.id });
});

// Details page: optional auth (server will mark isOwner if token provided)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Blog.findById(id);
    if (!result) return res.status(404).render('404', { title: 'Not Found' });

    const isOwner = !!(req.user && req.user.id === result.authorId);
    res.render('details', { title: 'Details', blog: result, isOwner });
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
});

router.post('/', authMiddleware, handleMulterError(upload.single('image')), async (req, res) => {
  try {
    const { title, snippet, content } = req.body;
    const cleanTitle = sanitizeHtml(title || '', { allowedTags: [], allowedAttributes: {} }).trim();
    const cleanSnippet = sanitizeHtml(snippet || '', { allowedTags: [], allowedAttributes: {} }).trim();
    const cleanContent = sanitizeHtml(content || '', sanitizeOptions);
    const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;

    const blog = new Blog({
      title: cleanTitle,
      snippet: cleanSnippet,
      content: cleanContent,
      imagePath,
      authorId: req.user.id
    });

    await blog.save();
    res.redirect('/blogs');
  } catch (err) {
    console.error('Error creating blog:', err);
    // Clean up uploaded file on error
    if (req.file && req.file.filename) {
      await safeDeleteFile(path.join(__dirname, '..', 'public', 'uploads', req.file.filename));
    }
    res.status(500).send('Server error');
  }
});

router.get('/edit/:id', (req, res) => {
  const id = req.params.id;

  Blog.findById(id).then((result) => {
    res.render('edit', { title: 'Edit Blog', blog: result });
  }).catch((err) => {
    console.log(err);
    res.status(500).send('Server error');
  });
});

router.put('/:id', authMiddleware, handleMulterError(upload.single('image')), async (req, res) => {
  try {
    const id = req.params.id;
    const { title, snippet, content } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) {
      // if a new file was uploaded, clean it up
      if (req.file && req.file.filename) {
        await safeDeleteFile(path.join(__dirname, '..', 'public', 'uploads', req.file.filename));
      }
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blog.authorId !== req.user.id) {
      if (req.file && req.file.filename) {
        await safeDeleteFile(path.join(__dirname, '..', 'public', 'uploads', req.file.filename));
      }
      return res.status(403).json({ error: 'Permission denied' });
    }

    const cleanTitle = sanitizeHtml(title || '', { allowedTags: [], allowedAttributes: {} }).trim();
    const cleanSnippet = sanitizeHtml(snippet || '', { allowedTags: [], allowedAttributes: {} }).trim();
    const cleanContent = sanitizeHtml(content || '', sanitizeOptions);

    const updateData = { title: cleanTitle, snippet: cleanSnippet, content: cleanContent };

    if (req.file) {
      if (blog.imagePath && blog.imagePath.startsWith('/uploads/')) {
        await safeDeleteFile(path.join(__dirname, '..', 'public', blog.imagePath));
      }
      updateData.imagePath = `/uploads/${req.file.filename}`;
    }

    await Blog.findByIdAndUpdate(id, updateData);
    res.json({ redirect: `/blogs/${id}` });
  } catch (err) {
    console.log(err);
    // clean up new upload on error
    if (req.file && req.file.filename) {
      await safeDeleteFile(path.join(__dirname, '..', 'public', 'uploads', req.file.filename));
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blog.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (blog.imagePath && blog.imagePath.startsWith('/uploads/')) {
      await safeDeleteFile(path.join(__dirname, '..', 'public', blog.imagePath));
    }

    await Blog.findByIdAndDelete(id);
    res.json({ redirect: '/blogs' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
