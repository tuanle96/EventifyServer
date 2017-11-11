'use strict';

var User = require('../models/index').user;
var jwt = require('jsonwebtoken');
const key = require('../config/index').key;

var login = (io, socket, object) => {

    var email = object.email,
        password = object.password

    var errors = [];
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!email) {
            errors.push('Email required');
        };
        if (!password) {
            errors.push('Password required');
        };
        if (errors.length) {
            workflow.emit('errors-handler', errors);
        } else {
            workflow.emit('sign-in');
        };
    });

    workflow.on('errors-handler', (errors) => {
        socket.emit('sign-in', { 'errors': errors })
    });

    workflow.on('sign-in', () => {
        User.findOne({ email: email }, (err, user) => {
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

                //create token
                var sign = {
                    id: user._id,
                    email: user.email
                };
                var token = jwt.sign(sign, key, {});

                user.token = token
                socket.emit('sign-in', user);            }
        });
    });

    workflow.emit('validate-parameters');
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
        //socket.emit('sign-up', { 'errors': errors })
        socket.emit('sign-in', { 'errors': errors });
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

                //create token
                var sign = {
                    id: user._id,
                    email: user.email
                };
                var token = jwt.sign(sign, key, {});

                user.token = token

                console.log(user)

                socket.emit('sign-up', user);
            }
        });
    });

    workflow.emit('validateParams');
}

//update password
var updatePw = (io, socket, currentPw, newPw, token) => {
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!currentPw) {
            workflow.emit('errors-handler' , 'Current password is required!');
            return
        }

        if (!newPw) {
            workflow.emit('error-handler', 'New password is required!');
            return
        }

        if (!token) {
            workflow.emit('errors-handler', 'Token not found');
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
                    workflow.emit('errors-handler', 'Id user not found');
                } else {
                    workflow.emit('update-password', id);
                }
            }
        });
    });

    workflow.on('errorsHandler', (error) => {
        socket.emit('update-password', { 'errors': errors });
    });

    workflow.on('updatePassword', (id) => {
        User.findById(id, (err, user) => {
            if (err) {
                workflow.emit('errorsHandler', err);
            } else {
                user.password = newPw
                user.save((err) => {
                    if (err) {
                        workflow.emit('errorsHandler', err);
                    } else {
                        socket.emit('update-password', {});
                    }
                });
            }
        });
    });

    workflow.emit('validateParameters');
}

//update information
var updateInformations = (io, socket, user, token) => {
   
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
var getInformations = (io, socket, token) => {
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validateToken', () => {
        if (!token) {
            workflow.emit('errorHandler', 'Token is required');
        }

        //validate token        
        jwt.verify(token, key, (err, decoded) => {
            if (err) {
                workflow.emit('errorHandler', err);
            } else {
                var id = decoded.id

                if (!id) {
                    workflow.emit('errorHandler', 'Id user not found');
                } else {
                    workflow.emit('getInformations', id);
                }
            }
        });
    });

    workflow.on('errorHandler', (error) => {
        socket.emit('get-informations', {"errors" : error});
        
    });

    workflow.on('getInformations', (id) => {
        User.findById(id, (err, user) => {
            if (err) {
                workflow.emit('errorHandler', err);
            } else {
                socket.emit('get-informations', user);
            }
        });
    });

    workflow.emit('validateToken');
}

//get informations with id
var getInformationsWithId = (io, socket, token, id) => {

}

//get liked event
var getLikedEvents = (req, res) => {

}

//get my tickets
var getMyTickets = (req, res) => {

}

//get my orders
var getMyOrders = (req, res) => {
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

