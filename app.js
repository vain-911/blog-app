require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const Blog = require('./models/blog');
const blogRouter = require('./routes/blogRouter');
const { authMiddleware, supabase } = require('./middleware/auth');

const fs = require('fs');
const https = require('https');
const path = require('node:path');
const dns = require('node:dns/promises');

dns.setServers(['8.8.8.8', '1.1.1.1']);

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please check your .env file. See .env.example for reference.');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

app.locals.authMiddleware = authMiddleware;

const dbURI = process.env.MONGODB_URI;

mongoose.connect(dbURI).then((result) => {
    console.log('connected to db');

    const startServer = () => {
      if (process.env.HTTPS === 'true') {
        try {
          const keyPath = path.join(__dirname, 'certs', 'localhost-key.pem');
          const certPath = path.join(__dirname, 'certs', 'localhost.pem');
          if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
            const key = fs.readFileSync(keyPath);
            const cert = fs.readFileSync(certPath);
            https.createServer({ key, cert }, app).listen(port, () => {
              console.log('app (https) is listening on', port);
            });
            return;
          } else {
            console.error('HTTPS requested but cert files not found in ./certs. Falling back to HTTP.');
          }
        } catch (err) {
          console.error('Failed to start HTTPS server:', err);
          console.error('Falling back to HTTP.');
        }
      }

      app.listen(port, () => {
        console.log('app is listening on', port);
      });
    };

    startServer();

}).catch((err) => {
    console.log(err);
});



app.set('view engine', 'ejs');
app.locals.SUPABASE_URL = process.env.SUPABASE_URL;
app.locals.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.redirect('/blogs');
});
app.get('/about', (req, res) => {
    res.render('about', { title: 'About us' });
});

app.use('/blogs', blogRouter);

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

app.use((req, res) => {
    res.status(404).render('404', { title: '404 - Not Found' });
});

