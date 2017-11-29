'use strict';
var mongoose = require('../config/index').db;
var Schema = mongoose.Schema;

module.exports = mongoose.model('Ticket', new Schema({
    name: String,
    description: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    dateCreated: Number,
    dateModified: Number,
    quantity: Number,
    price: Number,
    maxToOrder: Number,
    quantitiesSold: Number,
    quantitiesRemaining: Number    
}));