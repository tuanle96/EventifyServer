'use strict';
var mongoose = require('../config/index').db;
var Schema = mongoose.Schema;

module.exports = mongoose.model('Address', new Schema({
    placeId: {type: String, unique: true},
    fullAddress: String,
    latitude: Number,
    longtitude: Number
}));