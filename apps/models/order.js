'use strict';
var mongoose = require('../config/index').db;
var Schema = mongoose.Schema;

module.exports = mongoose.model('Order', new Schema({
    orderBy: { type: Schema.Types.ObjectId, ref: 'User' },
    dateOrder: Number,
    event: { type: Schema.Types.ObjectId, ref: 'Event' },    
    tickets: [{
        _id: { type: Schema.Types.Number, unique: true },
        quantity: Number,
        qrCode: String
    }],
    fullName: String,
    phoneNumber: Number
}));