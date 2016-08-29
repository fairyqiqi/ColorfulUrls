var express = require('express');
var router = express.Router();

var urlService = require('../services/colorfulUrlService');
var statsService = require('../services/statsService');

router.get('*', function (req, res) {
    var colorfulUrl = req.originalUrl.slice(1); // url looks like "/xxxx", need to skip "/"
    var longUrl = urlService.getLongUrl(colorfulUrl, function (url) {
        if (url){
            res.redirect(url.longUrl);
            statsService.logRequest(colorfulUrl, req);
        } else {
            res.sendFile('public/views/404.html', {root: './'});
        }
    });
});

module.exports = router;