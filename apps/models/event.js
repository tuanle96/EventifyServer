'use strict';
var mongoose = require('../config/index').db;
var Schema = mongoose.Schema;

module.exports = mongoose.model('Event', new Schema({    
    name: String,
    address: {type: Schema.ObjectId, ref: 'Address' },
    dateCreated: Number,
    dateModified: Number,
    PhotoCoverPath: String,
    descriptions: String,
    types: [{type: Schema.ObjectId, ref: 'Type' }],
    createdBy: {type: Schema.ObjectId, ref: 'User' },
    tickets: [{type: Schema.ObjectId, ref: 'Ticket' }]      
}));