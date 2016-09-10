var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
module.exports = io;
var mongoose = require('mongoose');
mongoose.connect('mongodb://colorfulurluser:colorfulurluser@ds017886.mlab.com:17886/colorfulurl');
var useragent = require('express-useragent');
var indexRouter = require('./routes/index');
var restRouter = require('./routes/rest');
var redirectRouter = require('./routes/redirect');
var colorfulUrlService = require('./services/colorfulUrlService');

app.use('/node_modules', express.static(__dirname + "/node_modules"));

app.use('/public', express.static(__dirname + "/public"));

app.use(useragent.express());

app.use('/', indexRouter);

app.use('/api/v1', restRouter);

app.use('/:colorfulUrl', redirectRouter);

colorfulUrlService.preLoadAllUrlToRedis();

//var port = parseInt(process.argv.slice(2));
var port = 7777;
http.listen(port);

io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('disconnect', function () {
        console.log('user disconected');
    })
});