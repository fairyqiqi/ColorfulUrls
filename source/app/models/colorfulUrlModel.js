var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ColorfulUrlSchema = new Schema({
    longUrl: String,
    colorfulUrl: String
});

var colorfulUrlModel = mongoose.model('colorfulUrlModel', ColorfulUrlSchema);

module.exports = colorfulUrlModel;