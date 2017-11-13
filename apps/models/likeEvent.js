'use strict';
var mongoose = require('../config/index').db;
var Schema = mongoose.Schema;

module.exports = mongoose.model('Liked', new Schema({
    name: String,
    dateLiked: Number,
    idEvent: { type: Schema.Types.ObjectId, ref: 'Event' },
    idUser: { type: Schema.Types.ObjectId, ref: 'User' }
}));