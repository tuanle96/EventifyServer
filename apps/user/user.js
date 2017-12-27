'use strict';

var User = require('../models/index').user;
var jwt = require('jsonwebtoken');
const key = require('../config/index').key;
const request = require('request');
const photoPath = 'uploads/Images/Users/';
const fs = require('fs');

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
var loginWithFacebook = (io, socket, FBToken) => {

}
//sign in with google plus
var loginWithGooglePlus = (io, socket, GGToken) => {

    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!GGToken) {
            workflow.emit('error-handler', 'Token is missing!');
            return
        };

        workflow.emit('sign-in-with-google-plus');
    });

    workflow.on('error-handler', (error) => {
        socket.emit('sign-in-with-google-plus', [{ 'error': error }]);
    });

    workflow.on('sign-in-with-google-plus', () => {

        //from token has been received, we can get user's informations via GooglePlus APIs and return it to client
        getInformationsFromGoogleAPI(GGToken, (error, informations) => {

        })
    });

    workflow.on('response', (informations) => {
        socket.emit('sign-in-with-google-plus', [informations]);
    });

    workflow.emit('validate-parameters');
}

//sign up with email & password
var signUp = (io, socket, object) => {
    var email = object.email,
        password = object.password,
        dateCreated = object.dateCreated,
        fullName = object.fullName,
        phoneNumber = object.phoneNumber

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

        if (!fullName) {
            workflow.emit('error-handler', 'Full name required');
            return
        }

        if (!phoneNumber) {
            workflow.emit('error-handler', 'Phone nubmer required');
            return
        }

        if (!dateCreated) {
            dateCreated = Date.now()
        }

        workflow.emit('sign-up');

    });

    workflow.on('error-handler', (error) => {
        socket.emit('sign-up', [{ 'error': error }]);
    });

    workflow.on('sign-up', () => {

        var user = new User({
            email: email,
            password: password,
            dateCreated: dateCreated,
            fullName: fullName,
            phoneNumber: phoneNumber
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

                if (user.password !== currentPw) {
                    workflow.emit('error-handler', 'Confirm password not match!')
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
            }
        });
    });

    workflow.emit('validate-parameters');
}

var updateAvatarUser = (io, socket, imgData, imgPath, token) => {
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!imgData) {
            workflow.emit('error-handler', 'Data image is required')
            return
        }

        if (!imgPath) {
            workflow.emit('error-handler', 'File name is required');
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
                let idUser = decoded.id
                if (!idUser) {
                    workflow.emit('error-handler', 'User not found');
                } else {
                    workflow.emit('upload-image-user', idUser)
                }
            }
        })
    });

    workflow.on('error-handler', (err) => {
        socket.emit('upload-image-user', [{ 'error': err }]);
    });

    workflow.on('upload-image-user', (idUser) => {
        //check exist path
        if (!fs.existsSync(photoPath)) {
            workflow.emit('error-handler', 'Path not found')
        } else {
            var path = photoPath + imgPath
            fs.writeFile(path, imgData, (err) => {
                if (err) {
                    workflow.emit('error-handler', err)
                } else {

                    User.findById(idUser, (err, user) => {
                        if (err) {
                            workflow.emit('error-handler', err);
                        } else {
                            user.photoPath = path
                            user.save((err) => {
                                if (err) {
                                    workflow.emit('error-handler', err);
                                } else {
                                    socket.emit('upload-image-user', [{ "path": 'http://' + socket.handshake.headers.host + '/' + user.photoPath }])
                                }
                            })
                        }
                    });
                }
            });
        }
    });

    workflow.emit('validate-parameters');
}

var updatePhoneNumber = (io, socket, newPhoneNumber, token) => {
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {

        if (!newPhoneNumber) {
            workflow.emit('error-handler', 'New phone number is required!');
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
                    workflow.emit('update-phone-number', id);
                }
            }
        });
    });

    workflow.on('error-handler', (error) => {
        socket.emit('update-phone-number', [{ 'error': error }]);
    });

    workflow.on('update-phone-number', (id) => {
        User.findById(id, (err, user) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                user.phoneNumber = newPhoneNumber;
                user.save((err) => {
                    if (err) {
                        workflow.emit('error-handler', err);
                    } else {
                        socket.emit('update-phone-number', [{}]);
                    }
                });
            }
        });
    });

    workflow.emit('validate-parameters');
}

var updateEmail = (io, socket, currentPassword, newEmail, token) => {
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!currentPassword) {
            workflow.emit('error-handler', 'Current password is required!');
            return
        }

        if (!newEmail) {
            workflow.emit('error-handler', 'New email is required!');
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
                    workflow.emit('update-email', id);
                }
            }
        });
    });

    workflow.on('error-handler', (error) => {
        socket.emit('update-email', [{ 'error': error }]);
    });

    workflow.on('update-email', (id) => {
        User.findById(id, (err, user) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                if (user.password !== currentPassword) {
                    workflow.emit('error-handler', 'Confirm password not match!')
                } else {
                    user.email = newEmail;
                    user.save((err) => {
                        if (err) {
                            workflow.emit('error-handler', err);
                        } else {
                            socket.emit('update-email', [{}]);
                        }
                    });
                }
            }
        });
    });

    workflow.emit('validate-parameters');
}

var updateFullName = (io, socket, newFullName, token) => {
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {

        if (!newFullName) {
            workflow.emit('error-handler', 'New full name is required!');
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
                    workflow.emit('update-full-name', id);
                }
            }
        });
    });

    workflow.on('error-handler', (error) => {
        socket.emit('update-full-name', [{ 'error': error }]);
    });

    workflow.on('update-full-name', (id) => {
        User.findById(id, (err, user) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                user.fullName = newFullName;
                user.save((err) => {
                    if (err) {
                        workflow.emit('error-handler', err);
                    } else {
                        socket.emit('update-full-name', [{}]);
                    }
                }); 
            }
        });
    });

    workflow.emit('validate-parameters');
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
                let path = user.photoPath

                if (path) {
                    user.photoPath = 'http://' + socket.handshake.headers.host + '/' + path;
                }
                socket.emit('get-informations', [user]);
            }
        });
    });

    workflow.emit('validate-token');
}

//get informations with id
var getInformationsWithId = (io, socket, token, id) => {

}

var getInformationWithEmail = (io, socket, email) => {

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

var newTicket = (io, socket, ticket, token) => {

}

var getInformationsFromGoogleAPI = (token, result) => {
    let urlEndpoint = "https://www.googleapis.com/plus/v1/people/?key=" + token

    console.log(urlEndpoint);

    request(urlEndpoint, (error, response, body) => {
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.

        if (error) {
            return result({ "error": error, "informations": null })
        }

        if ((response && response.statusCode) === 200) {

        }
        return result({ "error": "aa", "informations": null })
    });


}

var getInformationsFromFaceBook = (token, result) => {

    return result({});
}

var getInformationFromZalo = (token, result) => {

    return result({});
}


module.exports = {
    login: login,
    loginWithFacebook: loginWithFacebook,
    loginWithGooglePlus: loginWithGooglePlus,
    signUp: signUp,
    updatePw: updatePw,
    updatePhoneNumber: updatePhoneNumber,
    updateEmail: updateEmail,
    updateFullName: updateFullName,
    likeEvent: likeEvent,
    unlikeEvent: unlikeEvent,
    signOut: signOut,
    getInformations: getInformations,
    getInformationsWithId: getInformationsWithId,
    getLikedEvents: getLikedEvents,
    getMyTickets: getMyTickets,
    getMyOrders: getMyOrders,
    newOrder: newOrder,
    updateAvatarUser: updateAvatarUser
}

