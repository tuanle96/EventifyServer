
'use strict';

var Ticket = require('../models/index').ticket;
var jwt = require('jsonwebtoken');
const key = require('../config/index').key;
var lodash = require('lodash');

var User = require('../models/index').user;

/**
 * tickets for user manager
 */
var newTicket = (io, socket, ticket, token) => {    
    
    var name = ticket.name,
        description = ticket.description,
        quantity = ticket.quantity,
        price = ticket.price,
        maxToOrder = ticket.maxToOrder

    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!name) {
            workflow.emit('error-handler', "Name of ticket can not empty");
            return
        }

        if (!quantity) {
            workflow.emit('error-handler', "Quantity of ticket can not empty")
            return
        }

        if (!token) {
            workflow.emit('error-handler', 'Token is required');
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
                    workflow.emit('error-handler', 'Authentication failed')
                } else {
                    workflow.emit('new-ticket', id)
                }
            }
        });
    });

    workflow.on('error-handler', (error) => {
        socket.emit('new-ticket', [{ "error": error }]);
    });

    workflow.on('new-ticket', (idUser) => {

        /**
         * _id: { type: String, unique: true },
        name: String,
        maxToOrder: { type: Number, default: 10 },
        quantity: Number,
        price: Number,
        description: String
         */

        var ticketObject = {
            "name": name,
            "quantity": quantity,
            "dateCreated": Date.now()
        }

        if (description) { ticketObject.description = description }
        if (maxToOrder) { ticketObject.maxToOrder = maxToOrder }
        if (price) { ticketObject.price = price }

        console.log(ticketObject);        

        User.findById(idUser, (err, user) => {
            if (err) {
                workflow.emit('error-handler', 'User not found')
            } else {
                if (user.tickets) {
                    user.tickets.push(ticketObject)
                } else {
                    user.tickets = []
                    user.tickets.push(ticketObject)
                }
                
                user.save((err) => {
                    if (err) {
                        workflow.emit('error-handler', err)
                    } else {

                        let result = {
                            "success" : true
                        }

                        socket.emit('new-ticket', [result]);
                        socket.emit('get-tickets', user.tickets);
                    }
                });
            }
        })

        // var ticketObject = new Ticket();
        // ticketObject.name = name
        // ticketObject.quantitiesToSell = quantitiesToSell
        // ticketObject.dateCreated = Date.now()
        // ticketObject.createdBy = idUser

        // if (descriptions) { ticketObject.descriptions = descriptions }
        // if (maxQuantitiesToOrder) { ticketObject.maxQuantitiesToOrder = maxQuantitiesToOrder }
        // if (price) { ticketObject.price = price }
        // if (quantitiesSold) { ticketObject.quantitiesSold = quantitiesSold }
        // if (quantitiesRemaining) { ticketObject.quantitiesRemaining = quantitiesRemaining }

        // ticketObject.save((err) => {
        //     if (err) {
        //         workflow.emit('error-handler', err);
        //     } else {
        //         socket.emit('new-ticket', [ticketObject]);

        //         Ticket.find({ 'createdBy': idUser })
        //             .populate('User')
        //             .exec((err, tickets) => {
        //                 if (tickets.length == 0) {
        //                     socket.emit('get-tickets', [{}]);
        //                 } else {
        //                     socket.emit('get-tickets', tickets);
        //                 }
        //             });
        //     }
        // });
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

        User.findById(idUser, (err, user) => {
            if (err) {
                workflow.emit('error-handler', 'User not found');
            } else {
                let tickets = user.tickets;

                if (tickets) {
                    if (tickets.length === 0) {
                        socket.emit('get-tickets', [{}]);
                    } else {
                        socket.emit('get-tickets', tickets);
                    }
                } else {
                    socket.emit('get-tickets', [{}]);
                }
            }
        });

        // Ticket.find({ 'createdBy': idUser })
        //     .populate('User')
        //     .exec((err, tickets) => {
        //         if (err) {
        //             workflow.emit('error-handler', err);
        //         } else {
        //             if (tickets.length == 0) {
        //                 socket.emit('get-tickets', [{}]);
        //             } else {
        //                 socket.emit('get-tickets', tickets);
        //             }
        //         }
        //     });
    });

    workflow.emit('validate-token', token);
}

var deleteTicket = (io, socket, idTicket, token) => {
    var workflow = new (require('events').EventEmitter)();

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
                let id = decoded.id;
                if (!id) {
                    workflow.emit('error-handler', 'Authentication failed');
                } else {
                    workflow.emit('delete-ticket', (id));
                }
            }
        });
    });

    workflow.on('error-handler', (err) => {
        socket.emit('delete-ticket', [{ "error": err }]);
    })

    workflow.on('delete-ticket', (idUser) => {

        User.findById(idUser, (err, user) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                var tickets = user.tickets;

                if (tickets) {
                    if (tickets.length === 0) {
                        workflow.emit('error-handler', 'Tickets are empty');
                    } else {
                        let idx = tickets.findIndex(ticket => ticket._id == idTicket);
                        if (idx !== -1) {
                            user.tickets.splice(idx, 1);
                            user.save((err) => {
                                if (err) {
                                    workflow.emit('error-handler', err);
                                } else {
                                    let result = {
                                        "success": 1
                                    }
                                    socket.emit('delete-ticket', [result]);
                                    getTickets(io, socket, token)
                                }
                            })
                        } else {
                            workflow.emit('error-handler', 'Ticket not found');
                        }
                    }
                } else {
                    workflow.emit('error-handler', 'Tickets are empty');
                }
            }
        });

        // Ticket.deleteOne({ '_id': idTicket }, (err, result) => {
        //     if (err) {
        //         workflow.emit('error-handler', err);
        //     } else {

        //         var json = {
        //             "rowsDeleted": result.result.n,
        //             "success": result.result.ok
        //         }
        //         socket.emit('delete-ticket', [json])
        //         getTickets(io, socket, token)
        //     }
        // })
    });

    workflow.emit('validate-parameters');
}

var editTicket = (io, socket, ticket, token) => {
    var workflow = new (require('events').EventEmitter)();
    var idTicket = ticket._id, name = ticket.name,
        description = ticket.description,
        quantity = ticket.quantity,
        price = ticket.price,
        maxToOrder = ticket.maxToOrder

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
                    workflow.emit('edit-ticket', id);
                }
            }
        });
    });

    workflow.on('error-handler', (error) => {
        socket.emit('edit-ticket', [{ 'error': error }]);
    });

    workflow.on('edit-ticket', (idUser) => {

        User.findById(idUser, (err, user) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                var tickets = user.tickets;
                if (tickets) {
                    if (tickets.length === 0) {
                        workflow.emit('error-handler', 'Tickets is empty')
                    } else {
                        let index = lodash.findIndex(tickets, (ticket) => {
                            return ticket._id == idTicket;
                        });

                        if (index === -1) {
                            workflow.emit('error-handler', 'Ticket not found');
                        } else {
                            var ticket = tickets[index];
                            ticket.name = name;
                            ticket.quantity = quantity;
                            ticket.dateModified = Date.now();

                            if (description) { ticket.description = description }
                            if (maxToOrder) { ticket.maxToOrder = maxToOrder } else { ticket.maxToOrder = 10 }
                            if (price) { ticket.price = price }

                            user.tickets[index] = ticket
                            user.save((err) => {
                                if (err) {
                                    workflow.emit('error-handler', err);
                                } else {
                                    let result = {
                                        "success" : 1
                                    }
                                    socket.emit('edit-ticket', [result]);
                                    getTickets(io, socket, token)
                                }
                            });
                        }
                    }
                } else {
                    workflow.emit('error-handler', 'Tickets is empty')
                }
            }
        });

        // Ticket.findById(idTicket, (err, ticket) => {
        //     if (err) {
        //         workflow.emit('error-handler', err)
        //     } else {
        //         ticket.name = name
        //         ticket.quantitiesToSell = quantitiesToSell
        //         ticket.dateModified = Date.now()

        //         if (descriptions) { ticket.descriptions = descriptions } else { ticket.descriptions = "" }
        //         if (maxQuantitiesToOrder) { ticket.maxQuantitiesToOrder = maxQuantitiesToOrder } else { ticket.maxQuantitiesToOrder = "" }
        //         if (price) { ticket.price = price } else { ticket.price = "price" }
        //         if (quantitiesSold) { ticket.quantitiesSold = quantitiesSold } else { ticket.quantitiesSold = "" }
        //         if (quantitiesRemaining) { ticket.quantitiesRemaining = quantitiesRemaining } else { ticket.quantitiesRemaining = "" }

        //         ticket.save((err) => {
        //             if (err) {
        //                 workflow.emit('error-handler', err);
        //             } else {
        //                 socket.emit('edit-ticket', [ticket]);
        //             }
        //         });
        //     }
        // });
    });

    workflow.emit('validate-parameters');
}

module.exports = {
    newTicket: newTicket,
    getTickets: getTickets,
    deleteTicket: deleteTicket,
    editTicket: editTicket
}

