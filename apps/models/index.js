'use strict';

var event = require('./event');
var user = require('./user');
var ticket = require('./ticket');
var order = require('./order');
var type = require('./type');
var address = require('./address');
var like = require('./like');

module.exports = {
    event: event,
    user: user,
    ticket: ticket,
    order: order,
    type: type,
    address: address,
    like: like
}