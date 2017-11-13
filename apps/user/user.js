'use strict';

var User = require('../models/index').user;
var jwt = require('jsonwebtoken');
const key = require('../config/index').key;

var login = (io, socket, object) => {

    var email = object.email,
        password = object.password

    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!email) {
            workflow.emit('error-handler', 'Email is required');
            return
        };
        if (!password) {
            workflow.emit('error-handler', 'Password is required');
            return
        };

        workflow.emit('sign-in');

    });

    workflow.on('error-handler', (error) => {
        socket.emit('sign-in', [{ 'error': error }])
    });

    workflow.on('sign-in', () => {
        User.findOne({ email: email }, (err, user) => {
            if (err) {
                socket.emit('sign-in', [{ 'errors': err }]);
            };
            if (!user) {
                workflow.emit('error-handler', 'This email has been not registered.');
            } else if (user.password !== password) {
                workflow.emit('error-handler', 'Wrong password.');
            } else {

                //create token
                var sign = {
                    id: user._id,
                    email: user.email
                };
                var token = jwt.sign(sign, key, {});

                user.token = token
                socket.emit('sign-in', [user]);
            }
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

    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!email) {
            workflow.emit('error-handler', 'Email required');
            return
        };
        if (!password) {
            workflow.emit('error-handler', 'Password required');
            return
        };

        if (!dateCreated) {
            dateCreated = Date.now()
        }

        workflow.emit('sign-up');

    });

    workflow.on('error-handler', (error) => {
        socket.emit('sign-up', [{ 'error': errors }]);
    });

    workflow.on('sign-up', () => {

        var user = new User({
            email: email,
            password: password,
            dateCreated: dateCreated
        });

        user.save((err) => {
            if (err) {
                workflow.emit('error-handler', 'This email was used.');
            } else {

                //create token
                var sign = {
                    id: user._id,
                    email: user.email
                };
                var token = jwt.sign(sign, key, {});

                user.token = token

                socket.emit('sign-up', [user]);
            }
        });
    });

    workflow.emit('validate-parameters');
}

//update password
var updatePw = (io, socket, currentPw, newPw, token) => {
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!currentPw) {
            workflow.emit('error-handler', 'Current password is required!');
            return
        }

        if (!newPw) {
            workflow.emit('error-handler', 'New password is required!');
            return
        }

        if (!token) {
            workflow.emit('error-handler', 'Token not found');
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

    workflow.on('error-handler', (error) => {
        socket.emit('update-password', [{ 'error': error }]);
    });

    workflow.on('update-password', (id) => {
        User.findById(id, (err, user) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                user.password = newPw
                user.save((err) => {
                    if (err) {
                        workflow.emit('error-handler', err);
                    } else {
                        socket.emit('update-password', [{}]);
                    }
                });
            }
        });
    });

    workflow.emit('validate-parameters');
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

    workflow.on('validate-token', () => {
        if (!token) {
            workflow.emit('error-handler', 'Token is required');
            return
        }

        //validate token        
        jwt.verify(token, key, (err, decoded) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                var id = decoded.id

                if (!id) {
                    workflow.emit('error-handler', 'Id user not found');
                } else {
                    workflow.emit('get-informations', id);
                }
            }
        });
    });

    workflow.on('error-handler', (error) => {
        socket.emit('get-informations', [{ "error": error }]);
    });

    workflow.on('get-informations', (id) => {
        User.findById(id, (err, user) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                socket.emit('get-informations', [user]);
            }
        });
    });

    workflow.emit('validate-token');
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

