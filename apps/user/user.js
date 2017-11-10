'use strict';

var User = require('../models/index').user;
var jwt = require('jsonwebtoken');
const key = require('../config/index').key;

var login = (io, socket, email, password) => {

    var errors = [];
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validateParams', () => {
        if (!email) {
            errors.push('Email required');
        };
        if (!password) {
            errors.push('Password required');
        };

        if (errors.length) {
            workflow.emit('errors', errors);
        } else {
            workflow.emit('login');
        };
    });

    workflow.on('errors', (errors) => {
        socket.emit('sign-in', { 'errors': errors })
    });

    workflow.on('login', () => {
        User.findOne({ email: email }, (err, user) => {
            console.log(err + " | " + user);
            if (err) {
                socket.emit('sign-in', { 'errors': err });
            };
            if (!user) {
                errors.push('This email has been not registered.');
                workflow.emit('errors', errors);
            } else if (user.password !== password) {
                errors.push('Wrong password.');
                workflow.emit('errors', errors);
            } else {
                socket.emit('sign-in', JSON.stringify(user));
            }
        });
    });

    workflow.emit('validateParams');
}

//sign in with facebook
var loginWithFacebook = (req, res) => {

}
//sign in with google plus
var loginWithGooglePlus = (req, res) => {

}

//sign up with email & password
var signUp = (io, socket, object) => {
   
    var email = object.email, 
        password = object.password,
        dateCreated = object.dateCreated

    var errors = [];
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validateParams', () => {
        if (!email) {
            errors.push('Email required');
        };
        if (!password) {
            errors.push('Password required');
        };

        if (!dateCreated) {
            dateCreated = Date.now()
        }

        if (errors.length) {
            workflow.emit('errors', errors);
        } else {
            workflow.emit('insert');
        }
    });

    workflow.on('errors', (errors) => {
        socket.emit('sign-up', { 'errors': errors })
    });

    workflow.on('insert', () => {

        var user = new User({
            email: email,
            password: password,
            dateCreated: dateCreated
        });

        user.save((err) => {
            if (err) {
                errors.push('This email was used.');
                workflow.emit('errors', errors);
            } else {
                socket.emit('sign-up', JSON.stringify(user));   
            }
        });
    });

    workflow.emit('validateParams');
}

//update password
var updatePw = (req, res) => {

}

//update information
var updateInformations = (req, res) => {

}

//like event
var likeEvent = (req, res) => {

}

//unlike event
var unlikeEvent = (req, res) => {

}
//sign out
var signOut = (req, res) => {

}
//get information
var getInformations = (req, res) => {

}

//get informations with id
var getInformationsWithId = (req, res) => {

}

//get liked event
var getLikedEvents = (req, res) => {

}

//get my tickets
var getMyTickets = (req, res) => {

}

//get my orders
var getMyOrders = (req, res) => {
    console.log('get-my-orders')
}

//new order tickets
var newOrder = (req, res) => {

}

module.exports = {
    login: login,
    loginWithFacebook: loginWithFacebook,
    loginWithGooglePlus: loginWithGooglePlus,
    signUp: signUp,
    updatePw: updatePw,
    updateInformations: updateInformations,
    likeEvent: likeEvent,
    unlikeEvent: unlikeEvent,
    signOut: signOut,
    getInformations: getInformations,
    getInformationsWithId: getInformationsWithId,
    getLikedEvents: getLikedEvents,
    getMyTickets: getMyTickets,
    getMyOrders: getMyOrders,
    newOrder: newOrder,
}

