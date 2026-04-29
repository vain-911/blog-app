const express = require('express');
const Blog = require('../models/blog');
const router = express.Router();

router.get('/', (req, res)=>{
    Blog.find().then((result)=>{
        res.render('index', {title: 'Blogs', blogs: result});
    }).catch((err)=>{
        console.log(err);
        res.status(500).send('Server error');
    });
})


router.get('/create', (req, res) => {
    res.render('create', {title: 'Create blog'});
});

router.get('/:id', (req, res)=>{
    const id = req.params.id;

    Blog.findById(id).then((result)=>{
        res.render('details', {title: 'Details', blog: result});
    }).catch((err)=>{
        console.log(err)
    })

})   
router.post('/', (req, res) => {
  const { title, snippet, content } = req.body;
  const blog = new Blog(req.body);
  blog.save()
    .then(() => res.redirect('/blogs'))
    .catch((err) => {
      console.error('Error creating blog:', err);
      res.status(500).send('Server error');
    });
});
router.get('/edit/:id', (req, res)=>{
    const id = req.params.id;

    Blog.findById(id).then((result)=>{
        res.render('edit', {title: 'Edit Blog', blog: result});
    }).catch((err)=>{
        console.log(err);
    })
})

router.put('/:id', (req, res)=>{
    const id = req.params.id;

    Blog.findByIdAndUpdate(id, req.body).then((result)=>{
        res.json({ redirect: `/blogs/${id}` });
    }).catch((err)=>{
        console.log(err);
        res.status(500).json({ error: 'Server error' });
    })
})

router.delete('/:id', (req, res)=>{
    const id = req.params.id;

    Blog.findByIdAndDelete(id).then(result=>{
        res.json({ redirect: '/blogs' });
    }).catch((err)=>{
        console.log(err);
    })

})
module.exports = router;