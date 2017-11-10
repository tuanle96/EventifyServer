'use strict';
var mongoose = require('../config/index').db;
var Schema = mongoose.Schema;

module.exports = mongoose.model('Ticket', new Schema({
    name: String,
    description: String,
    createdBy: {type: Schema.ObjectId, ref: 'User' },
    dateCreated: Number,
    quantitiesToSell: Number,
    maxQuantitiesToOrder: Number,
    quantitiesSold: Number,
    quantitiesRemaing: Number
}));