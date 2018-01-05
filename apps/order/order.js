'use strict';

var jwt = require('jsonwebtoken');
const key = require('../config/index').key;
var lodash = require('lodash');
var mongoose = require('mongoose');
var fs = require('fs');

var Ticket = require('../models/index').ticket;
var User = require('../models/index').user;
var Order = require('../models/index').order;
var Event = require('../models/index').event;

let TicketRouter = require('../ticket/index').ticket;
let EventRouter = require('../event/index').event;

let pathQRCode = 'uploads/Images/Orders/';

var beginOrder = (io, socket, order, token) => {
    var idEvent = order.idEvent,
        tickets = order.tickets;

    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {

        //vadidate parameters
        if (!idEvent) {
            workflow.emit('error-handler', 'Event is required');
            return
        }

        if (!tickets || tickets.length === 0) {
            workflow.emit('error-handler', 'Tickets are empty');
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
                if (!idUser) {
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
        order._id = mongoose.Types.ObjectId()
        order.event = idEvent;
        order.orderBy = idUser;
        order.completed = false;
        order.tickets = []
        var ticketsToOrder = []

        for (let i = 0; i < tickets.length; i++) {
            let idCurrent = tickets[i].id;
            var count = 0;

            for (let j = 0; j < tickets.length; j++) {
                if (idCurrent == tickets[j].id) {
                    count++;
                }
            }

            let ticketToOrder = { 'id': tickets[i].id, 'quantity': count };

            let index = lodash.findIndex(ticketsToOrder, (ticket) => {
                return ticket.id === tickets[i].id
            });

            if (index == -1) {
                ticketsToOrder.push(ticketToOrder);
            }
        }

        var count = 1;
        lodash.forEach(tickets, (element) => {
            let id = element.id;

            if (!id) {
                workflow.emit('error-handler', 'Ticket not found!');
                return
            }

            let ticket = {
                '_id': mongoose.Types.ObjectId(id),
                'QRCode': order._id + '.' + id + '.' + count,
                'QRCodePath': pathQRCode + order._id + '.' + id + '.' + count + '.png',
                'isCheckedIn': false
            }

            order.tickets.push(ticket);

            count++;
        });

        var check = 0;
        lodash.forEach(ticketsToOrder, (ticket) => {
            let id = ticket.id,
                quantity = ticket.quantity;

            if (!id) {
                workflow.emit('error-handler', 'Ticket not found!');
                return
            }

            Ticket.findById(id, (err, element) => {

                if (err) {
                    workflow.emit('error-handler', 'Ticket not found');
                    return
                }

                var oldQuantitiesRemaining = element.quantitiesRemaining;
                var oldQuantitiesSold = element.quantitiesSold;

                var newQuantitiesRemaining = oldQuantitiesRemaining - quantity;
                var newQuantitiesSold = oldQuantitiesSold + quantity;

                element.quantitiesRemaining = newQuantitiesRemaining
                element.quantitiesSold = newQuantitiesSold

                element.save((err) => {
                    check += 1;
                    if (err) {
                        workflow.emit('error-handler', 'Update quantity of Ticket has been failed');
                        return
                    }

                    if (check === ticketsToOrder.length) {
                        workflow.emit('response', order);
                    }
                });
            });
        });
    });

    workflow.on('response', (order) => {
        order.save((err) => {
            if (err) {
                workflow.emit('error-handler', err);
                return
            }

            socket.emit('begin-order', [order])
            TicketRouter.getTicketsByEvent(io, socket, idEvent, token)
        });
    })

    workflow.emit('validate-parameters');
}

var order = (io, socket, order, token) => {

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
                const idUser = decoded.id
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
            order.dateOrder = Date.now() / 1000;
            order.completed = true;

            order.save((err) => {
                if (err) {
                    workflow.emit('error-handler', err);
                }

                //save to user
                User.findById(idUser, (err, user) => {
                    if (err) {
                        workflow.emit('error-handler', err);
                        return
                    }

                    if (!user.orders || user.orders.length === 0) { user.orders = []; }

                    user.orders.push(order._id);

                    user.save((err) => {
                        if (err) {
                            workflow.emit('error-handler', err);
                            return
                        }

                        //save user who order into event-colletion
                        Event.findById(order.event, (err, event) => {
                            if (err) {
                                workflow.emit('error-handler', err)
                            } else {
                                if (event) {
                                    if (!event.orders || event.orders.length === 0) {
                                        event.orders = [];
                                    }

                                    event.orders.push(id);
                                    event.save((err) => {
                                        if (err) {
                                            workflow.emit('error-handler', err);
                                        } else {
                                            workflow.emit('response');
                                        }
                                    });
                                } else {
                                    workflow.emit('response');
                                }
                            }
                        });
                    });
                });
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

var cancelOrder = (io, socket, id, token) => {

    var workflow = new (require('events').EventEmitter)();
    var idEvent = null;

    workflow.on('validate-parameters', () => {

        if (!id) {
            workflow.emit('error-handler', 'Id Order is required');
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
        Order.findById(id, (err, order) => {
            if (err) {
                workflow.emit('error-handler', err);
                return
            }
            idEvent = order.event
            let tickets = order.tickets;

            if (!tickets || tickets.length === 0) { workflow.emit('response'); return }

            var ticketsToOrder = [];

            for (var i = 0; i < tickets.length; i++) {
                var count = 0;
                for (var j = 0; j < tickets.length; j++) {
                    if (String(tickets[i]._id) == String(tickets[j]._id)) {
                        count++;
                    }
                }

                let ticketToOrder = { '_id': String(tickets[i]._id), 'quantity': count };

                let index = lodash.findIndex(ticketsToOrder, (ticket) => {
                    return ticket._id === String(tickets[i]._id)
                });

                if (index == -1) {
                    ticketsToOrder.push(ticketToOrder);
                }
            }
            var check = 0;
            lodash.forEach(ticketsToOrder, (element) => {
                let idTicket = element._id,
                    quantity = element.quantity;

                if (!idTicket) {
                    workflow.emit('error-handler', 'Ticket not found');
                    return
                }

                Ticket.findById(idTicket, (err, ticket) => {
                    if (err) {
                        workflow.emit('error-handler', err);
                        return
                    }

                    let oldQuantitiesRemaining = ticket.quantitiesRemaining,
                        oldQuantitiesSold = ticket.quantitiesSold

                    ticket.quantitiesRemaining = oldQuantitiesRemaining + quantity;
                    ticket.quantitiesSold = oldQuantitiesSold - quantity;

                    ticket.save((err) => {
                        check += 1;
                        if (err) {
                            workflow.emit('error-handler', err);
                            return
                        }

                        if (check === ticketsToOrder.length) {

                            Order.remove({ '_id': id }, (err) => {
                                if (err) {
                                    workflow.emit('error-handler', err);
                                    return
                                }
                                workflow.emit('response');
                            });
                        }
                    });
                });
            })
        });
    });

    workflow.on('response', () => {
        socket.emit('cancel-order', [{}]);
        TicketRouter.getTicketsByEvent(io, socket, idEvent, token)
    });

    workflow.emit('validate-parameters');
}

var getOrdersByToken = (io, socket, token) => {

    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
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
                var idUser = decoded.id
                if (!idUser) {
                    workflow.emit('error-handler', 'Id user not found')
                } else {
                    User.findById(idUser, (err, user) => {
                        if (err) {
                            workflow.emit('error-handler', err);
                            return
                        }

                        workflow.emit('get-orders-by-user', user);
                    })

                }
            }
        });
    });

    workflow.on('error-handler', (err) => {
        socket.emit('get-orders-by-user', [{ 'error': err }])
    });

    workflow.on('get-orders-by-user', (user) => {
        Order.find({ 'orderBy': user._id, 'completed': true })
            .populate('User')
            .exec((err, orders) => {
                if (err) {
                    workflow.emit('error-handler', err);
                } else {
                    //loop orders
                    lodash.forEach(orders, (order) => {
                        //lop tickets
                        var tickets = order.tickets;
                        order.orderBy = user;
                        if (tickets) {
                            lodash.forEach(tickets, (ticket) => {
                                let qrCode = ticket.QRCodePath;
                                let qrCodePath = 'http://' + socket.handshake.headers.host + '/' + qrCode;
                                ticket.QRCode = qrCodePath
                            });
                        }
                    });
                    workflow.emit('response', orders);
                }
            });
    });

    workflow.on('response', (orders) => {
        if (orders.length === 0) {
            socket.emit('get-orders', [{}])
        } else {
            var check = 0
            lodash.forEach(orders, (order) => {
                Event.findById(order.event, (err, event) => {
                    if (err) {
                        workflow.emit('error-handler', err);
                        return
                    }

                    getUser(event.createdBy, (err, user) => {
                        check += 1
                        if (err) {
                            workflow.emit('error-handler', err);
                            return
                        }

                        event.createdBy = user
                        order.event = event

                        if (check === orders.length) {
                            socket.emit('get-orders', orders);
                        }
                    })

                });
            });
        }
    });

    workflow.emit('validate-parameters');
}

//not completed
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

            let tickets = order.tickets,
                informations = order.informations,
                idEvent = order.event._id;

            if (!tickets || tickets.length === 0) {
                workflow.emit('error-handler', 'Ticket of Order is empty!');
                return
            }

            if (!informations) {
                workflow.emit('error-handler', 'Informations of Order is empty!');
                return
            }

            if (!idEvent) {
                workflow.emit('error-handler', 'Event not found');
                return
            }

            Event.findById(idEvent, (err, event) => {
                if (err) {
                    workflow.emit('error-handler', err);
                    return
                }

                order.event = event

                var check = 0
                lodash.forEach(tickets, (ticket) => {

                });
            });
        });
    });

    workflow.on('response', (order) => {
        socket.emit('order', [order])
    });

    workflow.emit('validate-parameters');
}

var checkOrder = (io, socket, qrCode, idEvent, token) => {
    //5a475be1c1b4b326a6f12d36.5a4741aa518eb724cc596ea1.1
    //from id order can get informations of user, order, ...
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!qrCode) {
            workflow.emit('error-handler', 'QRCode is required!');
            return
        }

        if (!idEvent) {
            workflow.emit('error-handler', 'Event is missing!');
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
                if (!decoded.id) {
                    workflow.emit('error-handler', 'Id user not found')
                } else {
                    workflow.emit('check-order');
                }
            }
        });
    });

    workflow.on('error-handler', (err) => {
        socket.emit('check-order', [{ 'error': err }])
    });

    workflow.on('check-order', () => {
        //split qrcode
        var code = lodash.split(qrCode, '.', 3);

        if (!code || code.length === 0 || code.length !== 3) {
            workflow.emit('error-handler', 'QRcode is not matched formation');
            return
        }

        const idOrder = code[0],
            idTicket = code[1];

        if (!idOrder) {
            workflow.emit('error-handler', 'Order not found');
            return
        }

        if (!idTicket) {
            workflow.emit('error-handler', 'Ticket not found');
            return
        }

        Order.findById(idOrder, (err, order) => {
            if (err) {
                workflow.emit('error-handler', err);
                return
            }

            if (!order) {
                workflow.emit('error-handler', 'Order not found');
                return
            }

            var fullName = order.informations.fullName,
                phoneNumber = order.informations.phoneNumber,
                idEventOfOrder = order.event,
                ticketType = null;

            //compare between idEvent of QRCode and idEvent of Order
            if (!idEventOfOrder) {
                workflow.emit('error-handler', 'Event was losed!');
                return
            }

            if (String(idEventOfOrder) !== idEvent) {
                let response = {
                    'STATUS': false,
                    'NAME': null,
                    'PHONE': null,
                    'CODE_NUMBER': null,
                    'TICKET_TYPE': null
                }

                workflow.emit('response', response);

                return;
            }


            if (!fullName || !phoneNumber) {
                workflow.emit('error-handler', 'Informations of User is missing');
                return
            }

            //mark check-in in ticket to TRUE
            //find ticket
            if (!order.tickets || order.tickets === 0) {
                workflow.emit('error-handler', 'Tickets are missing');
                return
            }

            var tickets = order.tickets.map(ticket => ticket.QRCode);

            //find index ticket
            for (let index = 0; index < tickets.length; index++) {
                if (qrCode == tickets[index]) {
                    order.tickets[index].isCheckedIn = true;
                    break
                }
            }

            Ticket.findById(idTicket, (err, ticket) => {
                if (err) {
                    workflow.emit('error-handler', err);
                    return
                }

                if (!ticket) {
                    workflow.emit('error-handler', 'Ticket is missing!');
                    return
                }

                ticketType = ticket.name;

                order.save((err) => {
                    if (err) {
                        workflow.emit('error-handler', err);
                        return
                    }

                    let response = {
                        'STATUS': true,
                        'NAME': fullName,
                        'PHONE': phoneNumber,
                        'CODE_NUMBER': code[1],
                        'TICKET_TYPE': ticketType
                    }

                    workflow.emit('response', response);
                });
            });
        });
    });

    workflow.on('response', (order) => {
        socket.emit('check-order', [order]);
        EventRouter.getOrdersByEvent(io, socket, idEvent, token);
    });

    workflow.emit('validate-parameters');
}

var getUser = (idUser, callback) => {

    if (!idUser) {
        return callback('Id user not found', null);
    }

    User.findById(idUser, (err, user) => {
        return callback(err, user);
    })
}


module.exports = {
    beginOrder: beginOrder,
    order: order,
    cancelOrder: cancelOrder,
    getOrderById: getOrderById,
    getOrdersByToken: getOrdersByToken,
    checkOrder: checkOrder
}

