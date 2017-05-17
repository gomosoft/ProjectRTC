/**
 * Module dependencies.
 */
var express = require('express')
,	path = require('path')
,	streams = require('./app/streams.js')();

var favicon = require('serve-favicon')
,	logger = require('morgan')
,	methodOverride = require('method-override')
,	bodyParser = require('body-parser')
,	errorHandler = require('errorhandler');

var app = express();

function allowCors(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Expose-Headers', 'Content-Length');
  res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range, Pragma, Cache-Control, If-Modified-Since');
  if (req.method === 'OPTIONS') {
    return res.send(200);
  } else {
    return next();
  }
}


// all environments
app.set('port', process.env.PORT || 9090);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use('/cdn', express.static(path.join(__dirname, 'public')));
app.use('/vendors',express.static(path.join(__dirname, 'bower_components')));
app.use(allowCors);


// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}



// routing
require('./app/routes.js')(app, streams);

var server = app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server, { origins: '*:*'});
/**
 * Socket.io event handling
 */
require('./app/socketHandler.js')(io, streams);