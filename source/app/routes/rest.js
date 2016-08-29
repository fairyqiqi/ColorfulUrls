var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var urlService = require('../services/colorfulUrlService');
var statsService = require('../services/statsService');

router.post('/urls', jsonParser, function (req, res) {
    var longUrl = req.body.longUrl; //longUrl is defined in json body
    urlService.getColorfulUrl(longUrl, function (url) {
        res.json(url);
    });
});

router.get('/urls/:colorfulUrl', function (req, res) {
    var colorfulUrl = req.params.colorfulUrl;
    urlService.getLongUrl(colorfulUrl, function (url) {
        if (url){
            res.json(url);
        } else {
            res.status(404).send("Cannot find the long URL for " + colorfulUrl)
        }
    });
});

router.get('/urls/:colorfulUrl/:info', function (req, res) {
   statsService.getUrlInfo(req.params.colorfulUrl, req.params.info, function (data) {
       res.json(data);
   }); 
});

module.exports = router;