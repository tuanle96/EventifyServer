'use strict';
var mongoose = require('../config/index').db;
var Address = require('./index').address
var Schema = mongoose.Schema;

module.exports = mongoose.model('Event', new Schema({
    name: String,
    address: {
        place_id: String,
        address: String,
        latitude: Number,
        longitude: Number
    },
    dateCreated: Number,
    dateModified: Number,
    photoCoverPath: String,
    descriptions: String,
    types: [{ _id: String, name: String }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    tickets: [{
        _id: { type: Schema.Types.ObjectId, ref: "Ticket" },
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
    }],
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    timeStart: Number,
    timeEnd: Number
}));




