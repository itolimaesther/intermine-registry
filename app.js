var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require("passport");


var index = require('./routes/index');
var instances = require('./routes/instances');
var synchronize = require('./routes/synchronize');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const scheduledAutomaticUpdate = require('./scheduled/automaticUpdate');

var User = require('./models/user');

var auth = require('./routes/auth');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
   if(req.url.substr(-1) != '/' && req.url.substr(-8) == "registry" && req.url.length > 1){
       res.redirect(301, req.url + "/");
   } else{
       next();
   }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/node_modules/bootstrap/dist'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//Routes
app.use('/', index);
app.use('/service/instances', instances);
app.use('/service/synchronize', synchronize);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;

  if (req.accepts('html')) {
    res.render('404', { url: req.url });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});


// error handler
app.use(function(err, req, res, next) {

  if (err.name === 'JsonSchemaValidation'){
    res.status(400).json({
        statusCode: 400,
        message: "Malformed JSON. Invalid or Missing Data.",
        executionTime: new Date().toLocaleString()
    });
    return;
  }

  // Need to check if this is ok
  // Check for Malformed JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    res.status(400).json({
        statusCode: 400,
        message: "Malformed JSON",
        executionTime: new Date().toLocaleString()
    });
    return;
  }
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
