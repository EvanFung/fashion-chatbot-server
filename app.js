'use strict';

var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var uuid = require('uuid');
var AV = require('leanengine');
var session = require('express-session');
const admin = require('firebase-admin')
const serviceAccount = require('./service-account.json')

// 加载云函数定义，你可以将云函数拆分到多个文件方便管理，但需要在主文件中加载它们
require('./cloud');



var app = express();
// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 设置默认超时时间
app.use(timeout('15s'));

// 加载云引擎中间件
app.use(AV.express());

app.enable('trust proxy');
// 需要重定向到 HTTPS 可去除下一行的注释。
// app.use(AV.Cloud.HttpsRedirect());

app.use(express.static('public'));
app.use(AV.Cloud.CookieSession({ secret: uuid.v4(), maxAge: 3600000, fetchUser: true }))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'evanfung',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true },
  // genid: function (req) {
  //   req.sessionID = uuid.v4()
  //   return req.sessionID // use UUIDs for session IDs
  // },
}));

app.get('/', function (req, res) {
  res.render('index', { currentTime: new Date() });
});


// 可以将一类的路由单独保存在一个文件中
app.use('/todos', require('./routes/todos'));
app.use('/product', require('./routes/product'));
app.use('/user', require('./routes/user'));
app.use('/social', require('./routes/social'));
app.use('/rating', require('./routes/rating'));
app.use('/comment', require('./routes/comment'));
app.use('/tweet', require('./routes/tweet'));

app.use(function (req, res, next) {
  // 如果任何一个路由都没有返回响应，则抛出一个 404 异常给后续的异常处理器
  if (!res.headersSent) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  }
});

// error handlers
app.use(function (err, req, res, next) {
  if (req.timedout && req.headers.upgrade === 'websocket') {
    // 忽略 websocket 的超时
    return;
  }

  var statusCode = err.status || 500;
  if (statusCode === 500) {
    console.error(err.stack || err);
  }
  if (req.timedout) {
    console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
  }
  res.status(statusCode);
  // 默认不输出异常详情
  var error = {};
  if (app.get('env') === 'development') {
    // 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
    error = err;
  }
  res.render('error', {
    message: err.message,
    error: error
  });
});

module.exports = app;
