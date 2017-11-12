'use strict';

var Ticket = require('../models/index').ticket;
var Event = require('../models/index').event;
var Address = require('../models/index').address;
var jwt = require('jsonwebtoken');
const key = require('../config/index').key;

/**
 * 
    name: String,
    address: {type: Schema.Types.ObjectId, ref: 'Address' },
    dateCreated: Number,
    dateModified: Number,
    PhotoCoverPath: String,
    descriptions: String,
    types: [{type: Schema.Types.ObjectId, ref: 'Type' }],
    createdBy: {type: Schema.Types.ObjectId, ref: 'User' },
    tickets: [{type: Schema.Types.ObjectId, ref: 'Ticket' }]   
 */

var newEvent = (io, socket, event, token) => {

    /**
     * { types: [ { id: 'U3RaYRiZBuIQ005ewkNc', name: 'Thể thao' } ],
  name: '123213123',
  timeEnd: 1510459200,
  _id: '',
  descriptions: 'Sdfsdfsdf',
  address: 
   { lng: -122.1429061889648,
     formatted_address: 'Palo Alto',
     lat: 37.44188219339512,
     place_id: 'ChIJORy6nXuwj4ARz3b1NVL1Hw4' },
  photoCoverPath: 'Images/EventCover/c7aXqRvpiMSXW9CuG1MxEO6mia121510458644.jpg',
  tickets: 
   [ { quantitiesToSell: 2131321,
       name: '213213',
       quantitiesRemaining: 2131321,
       descriptions: '21313',
       _id: '',
       price: 33213213,
       maxQuantitiesToOrder: 10 },
     { quantitiesToSell: 213213,
       name: '213123',
       quantitiesRemaining: 213213,
       descriptions: '213213',
       _id: '',
       price: 2132132,
       maxQuantitiesToOrder: 10 } ],
  dateCreated: 1510458881,
  createdBy: { id: '5a0702c804d0a4c40a663855', email: 'admin@Eventify.com' },
  timeStart: 1510459200 }
     */

    var name = event.name,
        descriptions = event.descriptions,
        address = event.address,
        dateCreated = Date.now(),
        photoCoverPath = event.photoCoverPath,
        types = event.types,
        createdBy = event.createdBy,
        tickets = event.tickets

    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        console.log(event)
        if (!name) {
            workflow.emit('error-handler', "Name of event can not empty");
            return
        }

        if (!address) {
            workflow.emit('error-handler', "Address of event can not empty")
            return
        }

        if (!photoCoverPath) {
            workflow.emit('error-handler', "PhotoCoverPath of event can not empty")
            return
        }

        if (!types || types.count == 0) {
            workflow.emit('error-handler', "Types of event can not empty")
            return
        }

        if (!tickets || tickets.count == 0) {
            workflow.emit('error-handler', "Ticket of event can not empty")
            return
        }

        if (!token) {
            workflow.emit('error-handler', 'Token not found');
        } else {
            workflow.emit('validate-token', token);
        }
    });

    workflow.on('validate-token', (token) => {
        jwt.verify(token, key, (err, decoded) => {
            if (err) {
                workflow.emit('error-handler', err)
            } else {
                var id = decoded.id
                if (!id) {
                    workflow.emit('error-handler', 'Id user not found')
                } else {
                    workflow.emit('new-event', id)
                }
            }
        });
    });

    workflow.on('error-handler', (error) => {
        socket.emit('new-event', { "errror": error });
    });

    workflow.on('new-event', (idUser) => {
        var event = new Event()
        //var address = new Address()
        event.name = name
        event.address = address
        event.dateCreated = dateCreated
        event.createdBy = idUser
        event.photoCoverPath = photoCoverPath
        console.log(event)
        event.save((err) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                socket.emit('new-event', event);
            }
        });
    });
    workflow.emit('validate-parameters');
}

module.exports = {
    newEvent: newEvent
}

