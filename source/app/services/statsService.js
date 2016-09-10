var geoip = require('geoip-lite');
var RequestModel = require('../models/requestModel');
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
        if (err) { console.log(err); return;}
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
    var startTime, endTime, filter, getTimestamp;
    if (topic === 'hour') {
        groupId = {
            year: {$year: "$timestamp"},
            month: {$month: "$timestamp"},
            day: {$dayOfMonth: "$timestamp"},
            hour: {$hour: "$timestamp"},
            minute: {$minute: "$timestamp"}
        };
        //get previous hour
        startTime = new Date(new Date().setHours(new Date().getHours() - 1));
        endTime = new Date();
        filter = {
            colorfulUrl: colorfulUrl,
            timestamp: {
                $lte: endTime,
                $gt: startTime
            }
        };
        //month in moment library is 0 based!!!!!!!
        getTimestamp = function (groupId) {
            var utcTime = moment.utc([groupId.year, groupId.month-1, groupId.day, groupId.hour, groupId.minute]).local();
            return new Date(utcTime.year(), utcTime.month(), utcTime.date(), utcTime.hour(), utcTime.minute());
        }
    } else if (topic === 'day') {
        groupId = {
            year: {$year: "$timestamp"},
            month: {$month: "$timestamp"},
            day: {$dayOfMonth: "$timestamp"},
            hour: {$hour: "$timestamp"}
        };
        //get previous day
        startTime = new Date(new Date().setDate(new Date().getDate() - 1));
        endTime = new Date(new Date().setHours(new Date().getHours() + 1));
        filter = {
            colorfulUrl: colorfulUrl,
            timestamp: {
                $lte: endTime,
                $gt: startTime
            }
        };
        getTimestamp = function (groupId) {
            var utcTime = moment.utc([groupId.year, groupId.month-1, groupId.day, groupId.hour]).local();
            return new Date(utcTime.year(), utcTime.month(), utcTime.date(), utcTime.hour());
        }
    } else if (topic === 'month') {
        groupId = {
            year: {$year: "$timestamp"},
            month: {$month: "$timestamp"},
            day: {$dayOfMonth: "$timestamp"}
        };
        //get previous month
        startTime = new Date(new Date().setMonth(new Date().getMonth() - 1));
        endTime = new Date();
        filter = {
            colorfulUrl: colorfulUrl,
            timestamp: {
                $lte: endTime,
                $gt: startTime
            }
        };
        getTimestamp = function (groupId) {
            var utcTime = moment.utc([groupId.year, groupId.month-1, groupId.day]).local();
            //local() will make 00:00 UTC to 08:00 HKT, we don't want the 8 hours difference, so we create a new Date below
            return new Date(utcTime.year(), utcTime.month(), utcTime.date());
        }
    } else {
        groupId = '$' + topic;
        filter = {
            colorfulUrl: colorfulUrl
        };
    }

    RequestModel.aggregate([
        {
            $match: filter
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
        var range = moment(startTime).twix(endTime);

        var timeIterator = '';
        if (topic === 'hour') {
            timeIterator = 'minutes';
        } else if (topic === 'day') {
            timeIterator = 'hours';
        } else {
            timeIterator = 'days'
        }

        var iterator = {};
        if (topic === 'hour'){
            iterator = range.iterate(5, timeIterator);
        } else {
            iterator = range.iterate(timeIterator);
        }

        var enrichedData = [];
        while (iterator.hasNext()) {
            var currentMoment = iterator.next();
            enrichedData.push({
                _id : {
                    year: currentMoment.year(),
                    month: currentMoment.month()+1, //month in data points on UI is 1-based
                    day: currentMoment.date(), //date() is day of the month, day() is day of the week (confusing)
                    hour: currentMoment.hour(),
                    minute: currentMoment.minute()
                },
                count: 0
            });
        }

        data.forEach(function (record) {
            for (var i = 0; i < enrichedData.length; i ++) {
                var recordDate = getTimestamp(record._id);
                var bucketDate = new Date(enrichedData[i]._id.year, enrichedData[i]._id.month-1, enrichedData[i]._id.day, enrichedData[i]._id.hour, enrichedData[i]._id.minute);
                if (recordDate <= bucketDate) {
                    enrichedData[i].count += record.count;
                    break;
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