const express = require('express');
const mongoose = require('mongoose');
const Blog = require('./models/blog');
const blogRouter = require('./routes/blogRouter');

const dns = require('node:dns/promises');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
const port = 3000;

//db connection
const dbURI = 'mongodb+srv://bloguser:Test1234@myblog.ilpyz2f.mongodb.net/macro?appName=myblog';

mongoose.connect(dbURI).then((result) => {
    console.log('connected to db');
    app.listen(port, () => {   
    console.log('app is listening to', port);
});
}).catch((err) => {
    console.log(err);
});



app.set('view engine', 'ejs');


app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.redirect('/blogs');
}); 
app.get('/about', (req, res) => {
    res.render('about', {title: 'About us'});
}); 

app.use('/blogs',blogRouter);
app.use((req, res) => {
    res.status(404).render('404', { title: '404 - Not Found' });
});

