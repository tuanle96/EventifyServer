
'use strict';

var Type = require('../models/index').type;
var jwt = require('jsonwebtoken');
const key = require('../config/index').key;

var getTypes = (io, socket, token) => {
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

            } else {
                if (!decoded.id) {
                    workflow.emit('error-handler', 'Id of user not found')
                } else {
                    workflow.emit('get-types')
                }
            }
        });
    });

    workflow.on('error-handler', (err) => {
        socket.emit('get-types', [{ 'error': err }]);
    });

    workflow.on('get-types', () => {
        Type.find({}, (err, types) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                if (types.length == 0) {
                    socket.emit('get-types', [{}]);
                } else {
                    socket.emit('get-types', types);
                }
            }
        })
    });

    workflow.emit('validate-parameters');
}

module.exports = {
    getTypes: getTypes
}

