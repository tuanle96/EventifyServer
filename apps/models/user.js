'use strict';
var mongoose = require('../config/index').db;
var Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
    email: { type: String, unique: true },
    password: String,
    dateCreated: Number,
    token: String,
    dateModified: Number,
    fullName: String,
    phoneNumber: String,
    photoPath: String,
    liked: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
    orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    myEvents: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
    tickets: [{
        name: String,
        maxToOrder: { type: Number, default: 10 },
        dateModified: Number,
        dateCreated: Number,
        quantity: Number,
        price: Number,
        description: String
    }]
}));