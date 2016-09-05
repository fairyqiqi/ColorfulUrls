var geoip = require('geoip-lite');
var RequestModel = require('../models/requestModel');
var _ = require('lodash/core');
var moment = require('moment');
require('twix');
var io = require('../server');

var logRequest = function (colorfulUrl, req) {
    var reqInfo = {};
    reqInfo.colorfulUrl = colorfulUrl;
    reqInfo.referer = req.headers.referer || 'Unknown'; //where's the request originated
    reqInfo.platform = req.useragent.platform || 'Unknown'; //windows or mac os
    reqInfo.browser = req.useragent.browser || 'Unknown';

    var ip = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
    var geo = geoip.lookup(ip);
    if (geo){
        reqInfo.country = geo.country;
    } else {
        reqInfo.country = 'Unknown';
    }

    reqInfo.timestamp = new Date();

    var request = new RequestModel(reqInfo);
    request.save(function (err, callback) {
        //TODO: handle error
        io.emit('newRequestLogged');
    });
};

var getUrlInfo = function (colorfulUrl, topic, callback) {
    if (topic == 'totalClicks') {
        RequestModel.count({colorfulUrl: colorfulUrl}, function (err, data) {
            callback(data);
        });
        return;
    }

    var groupId = '';
    if (topic === 'hour') {
        groupId = {
            year: {$year: "$timestamp"},
            month: {$month: "$timestamp"},
            day: {$dayOfMonth: "$timestamp"},
            hour: {$hour: "$timestamp"},
            minute: {$minute: "$timestamp"}
        }
    } else if (topic === 'day') {
        groupId = {
            year: {$year: "$timestamp"},
            month: {$month: "$timestamp"},
            day: {$dayOfMonth: "$timestamp"},
            hour: {$hour: "$timestamp"}
        }
    } else if (topic === 'month') {
        groupId = {
            year: {$year: "$timestamp"},
            month: {$month: "$timestamp"},
            day: {$dayOfMonth: "$timestamp"}
        }
    } else {
        groupId = '$' + topic;
    }

    RequestModel.aggregate([
        {
            $match: {
                colorfulUrl: colorfulUrl
            }
        },
        {
            $sort: {
                timestamp: -1
            }
        },
        {
            $group: {
                _id: groupId,
                count: {
                    $sum: 1
                }
            }
        }
    ], function (err, data) {
        //If there's no data in db, or it's not time related data, don't enrich.
        if (data.length == 0 || (topic != 'hour' && topic != 'day' && topic != 'month')) {
            callback(data);
            return;
        }

        //For time related data, enrich them so that they contain points for each time interval.
        var enrichedData = [];

        var timeIterator = '';
        if (topic === 'hour') {
            timeIterator = 'minutes';
        } else if (topic === 'day') {
            timeIterator = 'hours';
        } else {
            timeIterator = 'days'
        }

        //TODO: from now back to 1 hour / day / month
        var startTime = data[0]._id;
        var endTime = data[data.length-1]._id;
        var range =
            moment({
                year: startTime.year,
                month: startTime.month-1, //month is zero-based for moment!!!!!
                day: startTime.day,
                hour: startTime.hour,
                minute: startTime.minute })
            .twix({
                year: endTime.year,
                month: endTime.month-1,
                day: endTime.day,
                hour: endTime.hour,
                minute: endTime.minute});

        var iterator = {};
        if (topic === 'hour'){
            iterator = range.iterate(5, timeIterator);
        } else {
            iterator = range.iterate(timeIterator);
        }

        while (iterator.hasNext()) {
            var currentMinute = iterator.next();
            enrichedData.push({
                _id : {
                    year: currentMinute.year(),
                    month: currentMinute.month() + 1,
                    day: currentMinute.date(), //date() is day of the month, day() is day of the week (confusing)
                    hour: currentMinute.hour(),
                    minute: currentMinute.minute()
                },
                count: 0
            });
        }
        data.forEach(function (record) {
            for (var i = 0; i < enrichedData.length; i ++) {
                if (_.isEqual(enrichedData[i]._id, record._id)) {
                    enrichedData[i].count = record.count;
                    return;
                }
            }
        });

        callback(enrichedData);
    });
};

module.exports = {
    logRequest: logRequest,
    getUrlInfo: getUrlInfo
};