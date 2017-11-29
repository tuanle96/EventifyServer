'use strict';
var mongoose = require('../config/index').db;
var Address = require('./index').address
var Schema = mongoose.Schema;

let ticketRef = {
    type: Schema.Types.ObjectId,
    ref: "Ticket"
}

let userRef = {
    type: Schema.Types.ObjectId,
    ref: "User"
}

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
    createdBy: userRef,
    tickets: [{ ticketRef }],
    timeStart: Number,
    timeEnd: Number
}));

