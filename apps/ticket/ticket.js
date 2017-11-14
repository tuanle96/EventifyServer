
'use strict';

var Ticket = require('../models/index').ticket;
var jwt = require('jsonwebtoken');
const key = require('../config/index').key;
var newTicket = (io, socket, ticket, token) => {

    var name = ticket.name,
        descriptions = ticket.descriptions,
        quantitiesToSell = ticket.quantitiesToSell,
        price = ticket.price,
        maxQuantitiesToOrder = ticket.maxQuantitiesToOrder,
        quantitiesSold = ticket.quantitiesSold,
        quantitiesRemaining = ticket.quantitiesRemaining

    var workflow = new (require('events').EventEmitter)();
    workflow.on('validate-parameters', () => {
        if (!name) {
            workflow.emit('error-handler', "Name of ticket can not empty");
            return
        }

        if (!quantitiesToSell) {
            workflow.emit('error-handler', "Quantity of ticket can not empty")
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
                    workflow.emit('new-ticket', id)
                }
            }
        });
    });

    workflow.on('error-handler', (error) => {
        socket.emit('new-ticket', [{ "errror": error }]);
    });

    workflow.on('new-ticket', (idUser) => {
        var ticketObject = new Ticket();
        ticketObject.name = name
        ticketObject.quantitiesToSell = quantitiesToSell
        ticketObject.dateCreated = Date.now()
        ticketObject.createdBy = idUser

        if (descriptions) { ticketObject.descriptions = descriptions }
        if (maxQuantitiesToOrder) { ticketObject.maxQuantitiesToOrder = maxQuantitiesToOrder }
        if (price) { ticketObject.price = price }
        if (quantitiesSold) { ticketObject.quantitiesSold = quantitiesSold }
        if (quantitiesRemaining) { ticketObject.quantitiesRemaining = quantitiesRemaining }

        ticketObject.save((err) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                socket.emit('new-ticket', [ticketObject]);

                Ticket.find({ 'createdBy': idUser })
                    .populate('User')
                    .exec((err, tickets) => {
                        if (tickets.length == 0) {
                            socket.emit('get-tickets', [{}]);
                        } else {
                            socket.emit('get-tickets', tickets);
                        }
                    });
            }
        });
    });

    workflow.emit('validate-parameters');
}

var getTickets = (io, socket, token) => {
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-token', (token) => {
        if (!token) {
            workflow.emit('error-handler', 'Token required')
        } else {
            jwt.verify(token, key, (err, decoded) => {
                if (err) {
                    workflow.emit('error-handler', err);
                } else {
                    var idUser = decoded.id
                    if (!idUser) {
                        workflow.emit('error-handler', 'Id user not found')
                    } else {
                        workflow.emit('get-tickets', idUser);
                    }
                }
            });
        }
    });

    workflow.on('error-handler', (err) => {
        socket.emit('get-tickets', [{ 'error': err }])
    });

    workflow.on('get-tickets', (idUser) => {
        Ticket.find({ 'createdBy': idUser })
            .populate('User')
            .exec((err, tickets) => {
                if (err) {
                    workflow.emit('error-handler', err);
                } else {
                    if (tickets.length == 0) {
                        socket.emit('get-tickets', [{}]);
                    } else {
                        socket.emit('get-tickets', tickets);
                    }
                }
            });
    });

    workflow.emit('validate-token', token);
}

var deleteTicket = (io, socket, idTicket, token) => {
    var workflow = new (require('events').EventEmitter)();

    console.log(idTicket)

    workflow.on('validate-parameters', () => {
        if (!idTicket) {
            workflow.emit('error-handler', 'Id of ticket requied');
            return
        }

        if (!token) {
            workflow.emit('error-handler', 'Token is required');
            return
        }

        workflow.emit('validate-token', token);
    });

    workflow.on('validate-token', (token) => {
        jwt.verify(token, key, (err, decoded) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                workflow.emit('delete-ticket', idTicket);
            }
        });
    });

    workflow.on('error-handler', (err) => {
        socket.emit('delete-ticket', [{ "error": err }]);
    })

    workflow.on('delete-ticket', (idTicket) => {

        Ticket.deleteOne({ '_id': idTicket }, (err, result) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {

                var json = {
                    "rowsDeleted": result.result.n,
                    "success": result.result.ok
                }
                socket.emit('delete-ticket', [json])
                getTickets(io, socket, token)
            }
        })
    });

    workflow.emit('validate-parameters');
}

var editTicket = (io, socket, ticket, token) => {
    var workflow = new (require('events').EventEmitter)();
    var idTicket = ticket.id, name = ticket.name,
        descriptions = ticket.descriptions,
        quantitiesToSell = ticket.quantitiesToSell,
        price = ticket.price,
        maxQuantitiesToOrder = ticket.maxQuantitiesToOrder,
        quantitiesSold = ticket.quantitiesSold,
        quantitiesRemaining = ticket.quantitiesRemaining

    workflow.on('validate-parameters', () => {
        if (!idTicket) {
            workflow.emit('error-handler', 'Id ticket is required!');
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
                workflow.emit('errors-handler', err);
            } else {
                var id = decoded.id
                if (!id) {
                    workflow.emit('error-handler', 'Id user not found');
                } else {
                    workflow.emit('edit-ticket', idTicket);
                }
            }
        });
    });

    workflow.on('error-handler', (error) => {
        socket.emit('edit-ticket', [{ 'error': error }]);
    });

    workflow.on('edit-ticket', (idTicket) => {

        Ticket.findById(idTicket, (err, ticket) => {
            if (err) {
                workflow.emit('error-handler', err)
            } else {
                ticket.name = name
                ticket.quantitiesToSell = quantitiesToSell
                ticket.dateModified = Date.now()

                if (descriptions) { ticket.descriptions = descriptions } else { ticket.descriptions = "" }
                if (maxQuantitiesToOrder) { ticket.maxQuantitiesToOrder = maxQuantitiesToOrder } else { ticket.maxQuantitiesToOrder = "" }
                if (price) { ticket.price = price } else { ticket.price = "price" }
                if (quantitiesSold) { ticket.quantitiesSold = quantitiesSold } else { ticket.quantitiesSold = "" }
                if (quantitiesRemaining) { ticket.quantitiesRemaining = quantitiesRemaining } else { ticket.quantitiesRemaining = "" }

                ticket.save((err) => {
                    if (err) {
                        workflow.emit('error-handler', err);
                    } else {
                        socket.emit('edit-ticket', [ticket]);
                    }
                });
            }
        });
    });

    workflow.emit('validate-parameters');
}

module.exports = {
    newTicket: newTicket,
    getTickets: getTickets,
    deleteTicket: deleteTicket,
    editTicket: editTicket
}

