var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UrlSchema = new Schema({
    longUrl: String,
    shortUrlInNumber: Number
});

var urlModel = mongoose.model('urlModel', UrlSchema);

module.exports = urlModel;