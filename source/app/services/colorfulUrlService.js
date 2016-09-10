var ColorfulUrlModel = require('../models/colorfulUrlModel');

var redis = require('redis');
var host = process.env.REDIS_PORT_6379_TCP_ADDR || '127.0.0.1';
var port = process.env.REDIS_PORT_6379_TCP_PORT || '6379';
var redisClient = redis.createClient(port, host);

function preLoadAllUrlToRedis() {
    ColorfulUrlModel.find({}, function (err, urls) {
        urls.forEach(function (url) {
            redisClient.set(url.colorfulUrl, url.longUrl);
            redisClient.set(url.longUrl, url.colorfulUrl);
        });
        console.log("------------Redis: all urls reloaded");
    });
}

function getColorfulUrl(reqLongUrl, callback) {
    var longUrl = enrichLongUrl(reqLongUrl);

    redisClient.get(longUrl, function (err, colorfulUrl) {
        if (colorfulUrl) {
            console.log("------------Redis: found colorful url for long url " + reqLongUrl + " - " + colorfulUrl);
            callback({
                longUrl: longUrl,
                colorfulUrl: colorfulUrl
            })
        } else {
            console.log("------------Redis: not found colorful url for long url " + reqLongUrl);
            ColorfulUrlModel.findOne({ longUrl: longUrl }, function (err, url) {
                var colorfulUrl;
                //TODO: handle error
                if (url) {
                    colorfulUrl = url.colorfulUrl;
                } else {
                    colorfulUrl = generateColorfulUrl();
                    var unique = false;
                    do {
                        ColorfulUrlModel.findOne({colorfulUrl: colorfulUrl}, function (err, url) {
                            if (url) {
                                //TODO: there's chance that all the new colorfulUrl is existed
                                colorfulUrl = generateColorfulUrl();
                            } else {
                                unique = true;
                            }
                        });
                    }
                    while (unique);
                    console.log("------------Generated new colorful url - " + colorfulUrl);

                    var newUrl = new ColorfulUrlModel({
                        longUrl: longUrl,
                        colorfulUrl: colorfulUrl
                    });
                    newUrl.save();
                }
                redisClient.set(colorfulUrl, longUrl);
                redisClient.set(longUrl, colorfulUrl);
                callback({
                    longUrl: longUrl,
                    colorfulUrl: colorfulUrl
                });
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

function generateColorfulUrl() {
    var red = getRandomColorHexCode();
    var green = getRandomColorHexCode();
    var blue = getRandomColorHexCode();
    var alpha = getRandomIntInclusive(1, 10).toString(); //alpha: actual value should be 0.1~1
    if (alpha === '10') {
        alpha = "A"; //make "alpha" always have 1 char
    }
    return red + green + blue + alpha;
}

function getRandomColorHexCode() {
    var number = getRandomIntInclusive(0, 255);
    var numberString = number.toString(16);
    if (numberString.length == 1) {
        numberString = '0' + numberString; //make numberString always have 2 chars
    }
    return numberString;
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getLongUrl(colorfulUrl, callback) {
    redisClient.get(colorfulUrl, function (err, longUrl) {
        if (longUrl) {
            console.log("------------Redis: found long url - " + longUrl);
            callback({
                longUrl: longUrl,
                colorfulUrl: colorfulUrl
            });
        } else {
            ColorfulUrlModel.findOne({ colorfulUrl : colorfulUrl}, function (err, url) {
                //TODO: handle error
                if (url){
                    callback({
                        longUrl: url.longUrl,
                        colorfulUrl: colorfulUrl
                    });
                } else {
                    callback(url)
                }
            });
        }
    });
}

module.exports = {
    preLoadAllUrlToRedis: preLoadAllUrlToRedis,
    getColorfulUrl: getColorfulUrl,
    getLongUrl: getLongUrl
};