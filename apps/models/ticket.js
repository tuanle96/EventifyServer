'use strict';
var mongoose = require('../config/index').db;
var Schema = mongoose.Schema;

module.exports = mongoose.model('Ticket', new Schema({
    name: String,
    descriptions: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    dateCreated: Number,
    dateModified: Number,
    quantitiesToSell: Number,
    maxQuantitiesToOrder: Number,
    quantitiesSold: Number,
    quantitiesRemaining: Number,
    price: Number
}));