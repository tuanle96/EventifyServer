'use strict';

var jwt = require('jsonwebtoken');
const key = require('../config/index').key;
var lodash = require('lodash');
var mongoose = require('mongoose');
var QRCode = require('qrcode');
var fs = require('fs');

var Ticket = require('../models/index').ticket;
var User = require('../models/index').user;
var Order = require('../models/index').order;

let pathQRCode = 'uploads/Images/Orders/'



var beginOrder = (io, socket, order, token) => {

    var idEvent = order.idEvent, tickets = order.tickets;

    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {

        //vadidate parameters
        if (!idEvent) {
            workflow.emit('error-handler', 'Event is required');
            return
        }

        if (!tickets || tickets.lenght === 0) {
            workflow.emit('error-handler', 'Tickets are empty');
        } else {
            lodash.forEach(tickets, (ticket) => {
                var id = ticket.id, quantity = ticket.quantity;
                if (!id) {
                    workflow.emit('error-handler', 'Ticket not found');
                    return
                }

                if (!quantity) {
                    workflow.emit('error-handler', 'Quantity of ticket is required');
                    return
                }
            });
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
                var idUser = decoded.id
                if (!id) {
                    workflow.emit('error-handler', 'Authentication failed')
                } else {
                    workflow.emit('begin-order', idUser)
                }
            }
        });
    });

    workflow.on('error-handler', (error) => {
        socket.emit('begin-order', [{ "error": error }]);
    });

    workflow.on('begin-order', (idUser) => {

        var order = new Order();
        order.event = idEvent;
        order.orderBy = idUser;
        order.tickets = []

        var check = 0;
        lodash.forEach(tickets, (ticket) => {
            let id = ticket.id, quantity = ticket.quantity;

            if (!id) {
                workflow.emit('error-handler', 'Ticket not found!');
                return
            }

            if (!quantity) {
                workflow.emit('error-handler', 'Quantity of Ticket can not empty');
                return
            }

            let parameters = {
                '_id': mongoose.Types.ObjectId(id),
                'quantity': quantity
            }

            order.tickets.push(parameters);

            check += 1;

            if (check === tickets.lenght) {
                order.save((err) => {
                    if (err) {
                        workflow.emit('error-handler', err);
                        return
                    }

                    let result = {
                        "success": true
                    }

                    var check1 = 0;
                    lodash.forEach(tickets, (ticket) => {
                        let id = ticket.id, quantity = ticket.quantity;

                        Ticket.findById(id, (err, element) => {
                            if (err) {
                                workflow.emit('error-handler', 'Ticket not found');
                            } else {
                                let oldQuantitiesRemaining = element.quantitiesRemaining;
                                let oldQuantitiesSold = element.quantitiesSold;

                                var newQuantitiesRemaining = oldQuantitiesRemaining - quantity;
                                var newQuantitiesSold = oldQuantitiesSold + quantity;

                                element.quantitiesRemaining = newQuantitiesRemaining
                                element.quantitiesSold = newQuantitiesSold
                                element.save((err) => {
                                    if (err) {
                                        workflow.emit('error-handler', 'Update quantity of Ticket has been failed');
                                    } else {
                                        check1 += 1;
                                    }

                                    if (check1 === tickets.lenght) {
                                        workflow.emit('response', result);
                                    }
                                });
                            }
                        });
                    });

                });
            }
        });
    });

    workflow.on('response', (result) => {
        socket.emit('begin-order', [result])
    })

    workflow.emit('validate-parameters');
}

var order = (io, socket, order, token) => {

    /**
orderBy: { type: Schema.Types.ObjectId, ref: 'User' },
 dateOrder: Number,
 event: { type: Schema.Types.ObjectId, ref: 'Event' },
 tickets: [{
     _id: { type: Schema.Types.ObjectId, ref: 'Ticket' },
     quantity: Number,
     qrCodePath: String
 }],
 informations: {
     fullName: String,
     phoneNumber: Number
 } 
*/

    let id = order._id,
        fullName = order.fullName,
        phoneNumber = order.phoneNumber;

    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {

        if (!id) {
            workflow.emit('error-handler', 'Order not found');
            return
        }

        if (!fullName) {
            workflow.emit('error-handler', 'Fullname is required!');
            return
        }

        if (!phoneNumber) {
            workflow.emit('error-handler', 'Phone number is required!');
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
                workflow.emit('error-handler', err);
            } else {
                var idUser = decoded.id
                if (!idUser) {
                    workflow.emit('error-handler', 'Id user not found')
                } else {
                    workflow.emit('order', idUser);
                }
            }
        });

    });

    workflow.on('error-handler', (err) => {
        socket.emit('order', [{ 'error': err }])
    });

    workflow.on('order', (idUser) => {

        let informations = {
            'fullName': fullName,
            'phoneNumber': phoneNumber
        }

        Order.findById(id, (err, order) => {
            if (err) {
                workflow.emit('error-handler', err);
                return
            }

            order.informations = informations;

            order.save((err) => {
                if (err) {
                    workflow.emit('error-handler', err);
                }
                workflow.emit('response');
            });
        });

    });

    workflow.on('response', () => {

        let result = {
            "success": true
        }

        socket.emit('order', [result])
    });

    workflow.emit('validate-parameters');
}

var cancelOrder = (io, socket, order, token) => {
    var tickets = order.tickets,
        id = order._id;

    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {

        if (!id) {
            workflow.emit('error-handler', 'Id Order is required');
            return
        }

        if (!tickets || tickets.lenght === 0) {
            workflow.emit('error-handler', 'Tickets are empty');
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
                var idUser = decoded.id
                if (!id) {
                    workflow.emit('error-handler', 'Authentication failed')
                } else {
                    workflow.emit('cancel-order', idUser)
                }
            }
        });
    });

    workflow.on('error-handler', (error) => {
        socket.emit('cancel-order', [{ "error": error }]);
    });

    workflow.on('cancel-order', (idUser) => {
        var check = 0;
        lodash.forEach(tickets, (ticket) => {
            var id = ticket.id, quantity = ticket.quantity;
            if (!id) {
                workflow.emit('error-handler', 'Ticket not found');
                return
            }

            if (!quantity) {
                workflow.emit('error-handler', 'Quantity of ticket is required');
                return
            }

            Ticket.findById(id, (err, element) => {
                if (err) {
                    workflow.emit('error-handler', err);
                    return
                }

                let oldQuantitiesRemaining = element.quantitiesRemaining,
                    oldQuantitiesSold = element.quantitiesSold;

                let newQuantitiesRemaining = oldQuantitiesRemaining + quantity,
                    newQuantitiesSold = oldQuantitiesSold - quantity;


                element.quantitiesRemaining = newQuantitiesRemaining;
                element.quantitiesSold = newQuantitiesSold;

                element.save((err) => {
                    check += 1;
                    if (err) {
                        workflow.emit('error-handler', err);
                        return
                    }

                    if (check === tickets.lenght) {
                        Order.remove({ '_id': id }, (err) => {
                            if (err) {
                                workflow.emit('error-handler', err);
                                return
                            }
                            workflow.emit('response', { 'success': true });
                        });
                    }
                });
            });
        });
    });

    workflow.on('response', (result) => {
        socket.emit('cancel-order', [result])
    })

    workflow.emit('validate-parameters');
}

var getOrdersByToken = (io, socket, token) => {

    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!token) {
            workflow.emit('error-handler', 'Token is required');
        } else {
            workflow.emit('validate-token', token);
        }
    });

    workflow.on('validate-token', (token) => {
        jwt.verify(token, key, (err, decoded) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                var idUser = decoded.id
                if (!idUser) {
                    workflow.emit('error-handler', 'Id user not found')
                } else {
                    workflow.emit('order', idUser);
                }
            }
        });
    });

    workflow.on('error-handler', (err) => {
        socket.emit('get-orders-by-user', [{ 'error': err }])
    });

    workflow.on('get-orders-by-user', (idUser) => {

        Order.find({ 'orderBy': idUser })
            .populate('User')
            .exec((err, orders) => {
                if (err) {
                    workflow.emit('error-handler', err);
                } else {
                    workflow.emit('response', orders);
                }
            });
    });

    workflow.on('response', (orders) => {
        if (orders.lenght === 0) {
            socket.emit('order', [{}])
        } else {
            socket.emit('order', orders)
        }
    });

    workflow.emit('validate-parameters');
}

var getOrderById = (io, socket, idOrder, token) => {
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {

        if (!idOrder) {
            workflow.emit('error-handler', 'Id Event required!');
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
                workflow.emit('error-handler', err);
            } else {
                var idUser = decoded.id
                if (!idUser) {
                    workflow.emit('error-handler', 'Id user not found')
                } else {
                    workflow.emit('get-order-by-id', idUser);
                }
            }
        });
    });

    workflow.on('error-handler', (err) => {
        socket.emit('get-order-by-id', [{ 'error': err }])
    });

    workflow.on('get-order-by-id', (idUser) => {
        Order.findById(idOrder, (err, order) => {
            if (err) {
                workflow.emit('error-handler', err);
                return
            }

            let tickets = order.tickets, informations = order.informations;

            if (!tickets || tickets.lenght === 0) {
                workflow.emit('error-handler', 'Ticket of Order is empty!');
                return
            }

            if (!informations) {
                workflow.emit('error-handler', 'Informations of Order is empty!');
                return
            }

            var check = 0
            lodash.forEach(tickets, (ticket) => {
                generateQrCode(idUser, idEvent, ticket._id, informations, (err, path) => {
                    check += 1;

                    if (err) {
                        workflow.emit('error-handler', err);
                        return
                    }

                    ticket.qrCodePath = path;

                    if (check === tickets.lenght) {
                        workflow.emit('response', order)
                    }
                })
            });
        });
    });

    workflow.on('response', (order) => {
        socket.emit('order', [order])
    });

    workflow.emit('validate-parameters');
}

var generateQrCode = (idUser, idEvent, IdTicket, informations, response) => {

    if (!fs.existsSync(pathQRCode)) {
        workflow.emit('error-handler', 'Path of image order not found');
    } else {
        let nameOfQrcode = idOrder + IdTicket;
        let path = pathImageCover + nameOfQrcode;

        let text = {
            'idUser': idUser,
            'idEvent': idEvent,
            'idTicket': idTicket,
            'informations': informations
        }

        QRCode.toFile(path, text, {
            color: {
                dark: '#00F',  // Blue dots
                light: '#0000' // Transparent background
            }
        }, (err) => {

            if (err) {
                return response(err, null);
            } else {
                return response(null, pathQRCode + path);
            }
        });
    }
}

module.exports = {
    beginOrder: beginOrder,
    order: order,
    cancelOrder: cancelOrder,
    getOrderById: getOrderById,
    getOrdersByToken: getOrdersByToken
}

