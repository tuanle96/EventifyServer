var mongoose = require('mongoose');

mongoose.connect('mongodb://anhtuan96:leanhtuan110596@ds155695.mlab.com:55695/eventify', {useMongoClient: true});

module.exports = mongoose;