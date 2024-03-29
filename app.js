var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//routers
var routes = require('./routes/index');
var user = require('./routes/user');
var uploads = require('./routes/uploads');

var fs = require("fs");
// var config = {
//   key: fs.readFileSync('file.pem'),
//   cert: fs.readFileSync('file.crt')
// };

var ssl = {
  key: fs.readFileSync("privkey.pem"),
        cert: fs.readFileSync("fullchain.pem"),
        ca: fs.readFileSync("chain.pem")
};

var app = express();
var serverHttps = require('https').Server(ssl, app);
var serverHttp = require('http').Server(app);
var io = app.io = require('./routes/io')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(function (req, res, next) {
  res.io = io;
  next();
});
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// redirect http to https
 function ensureSecure(req, res, next) {
   if (req.secure) {
     return next();
   };
   res.redirect('https://' + req.hostname + req.url);
 };

//app.all('*', ensureSecure);

app.use('/', routes);
app.use('/user', user);
app.use('/uploads', uploads)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = { app: app, serverHttps: serverHttps, serverHttp: serverHttp, io: io };
