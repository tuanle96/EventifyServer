'use strict';

var Ticket = require('../models/index').ticket;
var Event = require('../models/index').event;
var User = require('../models/index').user;
var Address = require('../models/index').address;
var jwt = require('jsonwebtoken');
const key = require('../config/index').key;

var newEvent = (io, socket, event, token) => {

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
        event.name = name
        event.dateCreated = dateCreated
        event.createdBy = idUser
        event.photoCoverPath = photoCoverPath
        event.address = address
        event.tickets = tickets
        event.types = types
        event.createdBy = idUser

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

var getEvents = (io, socket, token) => {
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!token) {
            workflow.emit('error-handler', 'Token is required')
        } else {
            workflow.emit('validate-token', token)
        }
    });

    workflow.on('validate-token', (token) => {
        jwt.verify(token, key, (err, decoded) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                if (!decoded.id) {
                    workflow.emit('error-handler', 'Id of user not found');
                } else {
                    workflow.emit('get-events');
                }
            }
        });
    });

    workflow.on('error-handler', (err) => {
        socket.emit('get-events', err);
    });

    workflow.on('get-events', () => {
        Event.find({}, (err, events) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {

                var check = 0;
                events.forEach((event) => {
                 
                    if (event.createdBy) {
                        User.findById(event.createdBy, (err, user) => {
                            check += 1
                            event.createdBy = user
                            if (check === events.length) {                          
                                socket.emit('get-events', events);
                            }
                        })
                    } else {
                        check += 1
                    }
                });
            }
        });
    });

    workflow.emit('validate-parameters');
}

module.exports = {
    newEvent: newEvent,
    getEvents: getEvents
}

