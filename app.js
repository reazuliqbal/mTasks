const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const sassMiddleware = require('node-sass-middleware');
const mongoose = require('mongoose');
const session = require('cookie-session');
const expressSanitized = require('express-sanitize-escape');

const index = require('./routes/index');
const dashboard = require('./routes/dashboard');
const categories = require('./routes/categories');
const order = require('./routes/order');
const profile = require('./routes/profile');

const config = require('./config')

var app = express();

app.set('trust proxy', 1) // trust first proxy

var expiryDate = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000) // 1 week
app.use(session({
  name: 'session',
  keys: ['tenor75parks96Allegory', 'Pent29alderman32Haunter'],
  cookie: {
    expires: expiryDate
  }
}));

var mongo_url = "mongodb://127.0.0.1:27017/microtasks";
if(process.env.MONGOLAB_URI) {
    mongo_url = process.env.MONGOLAB_URI;
}
// MongoDB connection
mongoose.connect(mongo_url);

// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressSanitized.middleware());
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next){
  res.locals.session = req.session;
  next();
});

app.use('/', index);
app.use('/dashboard', dashboard);
app.use('/categories', categories);
app.use('/order', order);
app.use('/', profile);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
