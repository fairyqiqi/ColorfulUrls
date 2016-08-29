var geoip = require('geoip-lite');
var RequestModel = require('../models/requestModel');

var logRequest = function (colorfulUrl, req) {
    var reqInfo = {};
    reqInfo.colorfulUrl = colorfulUrl;
    reqInfo.referer = req.headers.referer || 'Unknown'; //wechat or facebook
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
    request.save();
};

var getUrlInfo = function (colorfulUrl, topic, callback) {
    if (topic == 'totalClicks') {
        RequestModel.count({colorfulUrl: colorfulUrl}, function (err, data) {
            callback(data);
        });
        return;
    }

    var groupId = '';
    groupId = '$' + topic;

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
        callback(data);
    });
};

module.exports = {
    logRequest: logRequest,
    getUrlInfo: getUrlInfo
};