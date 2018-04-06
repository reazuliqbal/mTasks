const express = require('express');
const path = require('path');
// const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const sassMiddleware = require('node-sass-middleware');
const mongoose = require('mongoose');
const session = require('express-session');
const expressSanitized = require('express-sanitize-escape');
const helmet = require('helmet');
const csrf = require('csurf');
const flash = require('express-flash-notification');
const MongoDBStore = require('connect-mongodb-session')(session);
require('dotenv').config();

const index = require('./routes/index');
const dashboard = require('./routes/dashboard');
const categories = require('./routes/categories');
const order = require('./routes/order');
const admin = require('./routes/admin');
const profile = require('./routes/profile');

const app = express();

const sessionStore = new MongoDBStore({
  uri: process.env.MONGODB,
  databaseName: process.env.MONGODB_NAME,
  collection: process.env.SESSION_COLLECTION,
});

app.use(helmet());

app.set('trust proxy', 1); // trust first proxy

app.use(session({
  secret: process.env.SESSION_KEY,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
  },
  store: sessionStore,
  resave: false,
  saveUninitialized: true,
  name: 'session',
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB);

// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressSanitized.middleware());
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true,
}));
app.use(csrf({ cookie: true }));

const flashNotificationOptions = {
  beforeSingleRender: (item, callback) => {
    if (item.type) {
      switch (item.type) {
        case 'success':
          item.type = 'Success';
          item.alertClass = 'green white-text';
          break;
        case 'info':
          item.type = 'Info';
          item.alertClass = 'light-blue lighten-3';
          break;
        case 'error':
          item.type = 'Error';
          item.alertClass = 'deep-orange white-text';
          break;
        default:

          break;
      }
    }
    callback(null, item);
  },
};
app.use(flash(app, flashNotificationOptions));

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/', index);
app.use('/dashboard', dashboard);
app.use('/categories', categories);
app.use('/order', order);
app.use('/admin', admin);
app.use('/', profile);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
