'use strict';
var mongoose = require('../config/index').db;
var Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
    email: {type: String, unique: true},
    password: String,
    dateCreated: Number,
    dateModified: Number,
    fullName: String,
    phoneNumber: String,
    photoPath: String
}));