var UrlModel = require('../models/urlModel');

var redis = require('redis');
var host = process.env.REDIS_PORT_6379_TCP_ADDR || '127.0.0.1';
var port = process.env.REDIS_PORT_6379_TCP_PORT || '6379';
var redisClient = redis.createClient(port, host);

var genCharArray = function (charA, charZ) {
    var arr = [];
    var i = charA.charCodeAt(0);
    var j = charZ.charCodeAt(0);

    for (var k = i; k <= j; k++) {
        arr.push(String.fromCharCode(k));
    }

    return arr;
};

var encode = function () {
    var encodeArr = [];
    encodeArr = encodeArr.concat(genCharArray('0', '9'));
    encodeArr = encodeArr.concat(genCharArray('A', 'Z'));
    encodeArr = encodeArr.concat(genCharArray('a', 'z'));
    return encodeArr;
}();

function ConvertTo62(num) {
    var result = '';
    do {
        result = encode[num % 62] + result;
        num = Math.floor(num / 62);
    } while (num > 0);

    return result;
}

function ConvertToInt(shortUrl) {
    var length = shortUrl.length;
    var shortUrlInNumber = 0;
    for (var i = 0; i < length; i++) {
        var encodingLength = encode.length;
        var c = shortUrl.charAt(i);
        var index = encode.indexOf(c);
        shortUrlInNumber += index * Math.pow(encodingLength, length-i-1);
    }
    return shortUrlInNumber;
}

function getShortUrl(reqLongUrl, callback) {
    var longUrl = enrichLongUrl(reqLongUrl);

    redisClient.get(longUrl, function (err, shortUrl) {
        if (shortUrl) {
            console.log("------------Redis: get short url");
            callback({
                longUrl: longUrl,
                shortUrl: shortUrl
            })
        } else {
            UrlModel.findOne({ longUrl: longUrl }, function (err, url) {
                //TODO: handle error
                if (url) {
                    var shortUrl = ConvertTo62(url.shortUrlInNumber);
                    redisClient.set(shortUrl, longUrl);
                    redisClient.set(longUrl, shortUrl);
                    callback({
                        longUrl: longUrl,
                        shortUrl: shortUrl
                    });
                } else {
                    generateShortUrl(function (shortUrlInNumber) {
                        var url = new UrlModel({
                            longUrl: longUrl,
                            shortUrlInNumber: shortUrlInNumber
                        });
                        url.save();
                        var shortUrl = ConvertTo62(shortUrlInNumber);
                        redisClient.set(shortUrl, longUrl);
                        redisClient.set(longUrl, shortUrl);
                        callback({
                            longUrl: longUrl,
                            shortUrl: shortUrl
                        });
                    });
                }
            });
        }
    });
}

function enrichLongUrl(longUrl) {
    if (!longUrl) return longUrl;
    if (longUrl.indexOf('http') === -1) {
        longUrl = "http://" + longUrl;
    }
    return longUrl;
}

function generateShortUrl(callback) {
    //TODO: use count
    UrlModel.find({}, function (err, urls) {
        //TODO: handle error
        callback(urls.length);
    });
}

function getLongUrl(shortUrl, callback) {
    var shortUrlInNumber = ConvertToInt(shortUrl);

    redisClient.get(shortUrl, function (err, longUrl) {
        if (longUrl) {
            console.log("------------Redis: get long url");
            callback({
                longUrl: longUrl,
                shortUrl: shortUrl
            });
        } else {
            UrlModel.findOne({ shortUrlInNumber : shortUrlInNumber}, function (err, url) {
                //TODO: handle error
                if (url){
                    callback({
                        longUrl: url.longUrl,
                        shortUrl: shortUrl
                    });
                } else {
                    callback(url)
                }
            });
        }
    });
}

module.exports = {
    getShortUrl: getShortUrl,
    getLongUrl: getLongUrl
};