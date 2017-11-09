'use strict';

var jwt = require('jsonwebtoken');
const key = require('../config/index').key;

//
var requireSession = (req, res, next) => {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token) {
        jwt.verify(token, key, (err, decoded) => {
            if (err) {
                res.json({
                    errors: ['Invalid token']
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        res.json({
            errors: ['Authorization required']  
        });
    }
};

//
var requireTeacher = (req, res, next) => {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token) {
        jwt.verify(token, key, (err, decoded) => {
            if (err) {
                res.json({
                    result: null,
                    errors: ['Invalid token']
                });
            } else {
                if (decoded.role === 'teacher'){
                    req.decoded = decoded;
                    next();
                } else {
                    res.json({
                        errors: ['Role Teacher required']  
                    });
                }
                
            }
        });
    } else {
        res.json({
            errors: ['Authorization required']  
        });
    }
};

var requireStudent = (req, res, next) => {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token) {
        jwt.verify(token, key, (err, decoded) => {
            if (err) {
                res.json({
                    result: null,
                    errors: ['Invalid token']
                });
            } else {
                if (decoded.role === 'student'){
                    req.decoded = decoded;
                    next();
                } else {
                    res.json({
                        errors: ['Role Student required']  
                    });
                }
                
            }
        });
    } else {
        res.json({
            errors: ['Authorization required']  
        });
    }
};

module.exports = {
    requireSession: requireSession,
    requireTeacher: requireTeacher,
    requireStudent: requireStudent
}