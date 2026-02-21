const express = require('express');
const path = require('path');
const helmet = require('helmet');
const session = require('express-session');
const methodOverride = require('method-override');
const config = require('./config');

const app = express();

// Security headers (relaxed for inline styles/scripts)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Method override for PUT/DELETE from HTML forms
app.use(methodOverride((req) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

// Sessions
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set true behind HTTPS proxy
      maxAge: 1000 * 60 * 60 * 4, // 4 hours
    },
  })
);

// Make session available in EJS views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/index'));
app.use('/contact', require('./routes/contact'));
app.use('/admin', require('./routes/admin'));

// 404
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong');
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
