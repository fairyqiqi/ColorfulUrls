var express = require('express');
var app = express();

var mongoose = require('mongoose');
mongoose.connect('mongodb://colorfulurluser:colorfulurluser@ds017886.mlab.com:17886/colorfulurl');

var useragent = require('express-useragent');

var indexRouter = require('./routes/index');
var restRouter = require('./routes/rest');
var redirectRouter = require('./routes/redirect');

app.use('/node_modules', express.static(__dirname + "/node_modules"));

app.use('/public', express.static(__dirname + "/public"));

app.use(useragent.express());

app.use('/', indexRouter);

app.use('/api/v1', restRouter);

app.use('/:colorfulUrl', redirectRouter);

app.listen(7777);