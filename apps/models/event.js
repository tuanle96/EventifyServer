'use strict';
var mongoose = require('../config/index').db;
var Address = require('./index').address
var Schema = mongoose.Schema;

module.exports = mongoose.model('Event', new Schema({    
    name: String,
    address: {
        placeId: {type: String, unique: true},
        fullAddress: String,
        latitude: Number,
        longtitude: Number
    },
    dateCreated: Number,
    dateModified: Number,
    photoCoverPath: String,
    descriptions: String,
    types: [{type: Schema.Types.ObjectId, ref: 'Type' }],
    createdBy: {type: Schema.Types.ObjectId, ref: 'User' },
    tickets: [{type: Schema.Types.ObjectId, ref: 'Ticket' }]      
}));