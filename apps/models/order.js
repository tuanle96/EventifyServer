'use strict';
var mongoose = require('../config/index').db;
var Schema = mongoose.Schema;

module.exports = mongoose.model('Order', new Schema({
    orderBy: { type: Schema.Types.ObjectId, ref: 'User' },
    dateOrder: Number,
    event: { type: Schema.Types.ObjectId, ref: 'Event' },
    tickets: [{
        _id: { type: Schema.Types.ObjectId, ref: 'Ticket' },
        QRCode: String
    }],
    informations: {
        fullName: String,
        phoneNumber: Number
    },
    completed: { type: Schema.Types.Boolean }
}));