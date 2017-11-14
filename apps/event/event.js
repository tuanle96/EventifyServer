'use strict';

var express = require('express');
var router = express.Router();
var Ticket = require('../models/index').ticket;
var Event = require('../models/index').event;
var User = require('../models/index').user;
var Address = require('../models/index').address;
var Like = require('../models/index').like;
var jwt = require('jsonwebtoken');
const key = require('../config/index').key;
var fs = require('fs');
var request = require('request');
let pathImageCover = 'uploads/Images/Events/Cover/'

var newEvent = (io, socket, event, token) => {

    var name = event.name,
        descriptions = event.descriptions,
        address = event.address,
        dateCreated = Date.now(),
        photoCoverPath = event.photoCoverPath,
        types = event.types,
        createdBy = event.createdBy,
        tickets = event.tickets,
        timeStart = event.timeStart,
        timeEnd = event.timeEnd

    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {  
        if (!name) {
            workflow.emit('error-handler', "Name of event can not empty");
            return
        }

        if (!address) {
            workflow.emit('error-handler', "Address of event can not empty")
            return
        }

        if (!photoCoverPath) {
            workflow.emit('error-handler', "PhotoCoverPath of event can not empty")
            return
        }

        if (!types || types.count == 0) {
            workflow.emit('error-handler', "Types of event can not empty")
            return
        }

        if (!tickets || tickets.count == 0) {
            workflow.emit('error-handler', "Ticket of event can not empty")
            return
        }

        if (!timeStart) {
            workflow.emit('error-handler', "Time start of event can not empty")
            return
        }

        if (!timeEnd) {
            workflow.emit('error-handler', "Time end of event can not empty")
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
                workflow.emit('error-handler', err)
            } else {
                var id = decoded.id
                if (!id) {
                    workflow.emit('error-handler', 'Id user not found')
                } else {
                    workflow.emit('new-event', id)
                }
            }
        });
    });

    workflow.on('error-handler', (error) => {
        socket.emit('new-event', [{ "errror": error }]);
    });

    workflow.on('new-event', (idUser) => {
        var event = new Event()
        event.name = name
        event.dateCreated = dateCreated
        event.createdBy = idUser
        event.photoCoverPath = photoCoverPath
        event.address = address
        event.tickets = tickets
        event.types = types
        event.createdBy = idUser
        event.timeStart = timeStart
        event.timeEnd = timeEnd

        //var path = 'http://' + socket.handshake.headers.host + '/' + event.photoCoverPath
        //event.photoCoverPath = path

        event.save((err) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                socket.emit('new-event', [{ "success": true }]);
                getEvents(io, socket, token)
            }
        });
    });
    workflow.emit('validate-parameters');
}

var getEvents = (io, socket, token) => {
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!token) {
            workflow.emit('error-handler', 'Token is required')
        } else {
            workflow.emit('validate-token', token)
        }
    });

    workflow.on('validate-token', (token) => {
        jwt.verify(token, key, (err, decoded) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                if (!decoded.id) {
                    workflow.emit('error-handler', 'Id of user not found');
                } else {
                    workflow.emit('get-events');
                }
            }
        });
    });

    workflow.on('error-handler', (err) => {
        socket.emit('get-events', [{ 'error': err }]);
    });

    workflow.on('get-events', () => {
        Event.find({}, (err, events) => {
            if (err) {
                workflow.emit('error-handler', err);
            } else {
                if (events.length == 0) {
                    socket.emit('get-events', [{}])
                } else {
                    var check = 0;
                    events.forEach((event) => {
                        var path = 'http://' + socket.handshake.headers.host + '/' + event.photoCoverPath
                        event.photoCoverPath = path
                        if (event.createdBy) {
                            User.findById(event.createdBy, (err, user) => {
                                check += 1
                                event.createdBy = user
                                if (check === events.length) {
                                    socket.emit('get-events', events);
                                }
                            })
                        } else {
                            check += 1
                        }
                    });
                }
            }
        });
    });



    workflow.emit('validate-parameters');
}

var uploadImageCover = (io, socket, imgData, imgPath, token) => {

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
                if (!decoded.id) {
                    workflow.emit('error-handler', 'User not found');
                } else {
                    workflow.emit('upload-image-cover')
                }
            }
        })
    });

    workflow.on('error-handler', (err) => {
        socket.emit('upload-image-cover-event', [{ 'error': err }]);
    });

    workflow.on('upload-image-cover', () => {
        //check exist path
        if (!fs.existsSync(pathImageCover)) {
            workflow.emit('error-handler', 'Path not found')
        } else {
            var path = pathImageCover + imgPath
            fs.writeFile(path, imgData, (err) => {
                if (err) {
                    workflow.emit('error-handler', err)
                } else {
                    socket.emit('upload-image-cover-event', [{ "path": path }])
                }
            });
        }
    });

    workflow.emit('validate-parameters');
}

var getLikedEvents = (io, socket, token) => {
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!token) {
            workflow.emit('error-handler', 'Token of user is required!')
        } else {
            workflow.emit('validate-token', token)
        }
    });

    workflow.on('validate-token', (token) => {
        jwt.verify(token, key, (err, decoded) => {
            if (err) {
                workflow.emit('error-handler', err)
            } else {
                let idUser = decoded.id
                if (!idUser) {
                    workflow.emit('error-handler', 'Id of User is required!')
                } else {
                    workflow.emit('get-liked-events', idUser)
                }
            }
        })
    });

    workflow.on('error-handler', (err) => {
        socket.emit('get-liked-events', [{ 'error': err }]);
    });

    workflow.on('get-liked-events', (idUser) => {
        User.findById(idUser, 'liked', (err, user) => {
            if (user.liked) {
                socket.emit('get-liked-events', user.liked)
                //console.log(user._id)
                //io.emit('get-liked-events', [user.liked, user._id])
            }
        });
    });

    workflow.emit('validate-parameters');
}

var like = (io, socket, idEvent, token) => {
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!idEvent) {
            workflow.emit('error-handler', 'Id of Event is required!')
            return
        }

        if (!token) {
            workflow.emit('error-handler', 'Token of User is required!');
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
                    workflow.emit('error-handler', 'Id of User is required');
                } else {
                    //console.log(idEvent + " | " + idUser)
                    workflow.emit('like-event', (idUser));
                }
            }
        });
    });

    workflow.on('error-handler', (err) => {
        socket.emit('like-event', [{ 'error': err }]);
    });

    workflow.on('like-event', (idUser) => {
        User.findById(idUser, (err, user) => {
            let likes = user.liked

            if (!likes) {
                user.liked = []
            }

            if (!user.liked.find((idEventLiked) => {
                return idEvent == idEventLiked
            })) {
                user.liked.push(idEvent)
                user.save((err) => {
                    if (err) {
                        workflow.emit('error-handler', err);
                    } else {
                        getLikedEvents(io, socket, token);
                    }
                });
            } 
        });
    });
    workflow.emit('validate-parameters');
}

var unlike = (io, socket, idEvent, token) => {
    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!idEvent) {
            workflow.emit('error-handler', 'Id of Event is required!')
            return
        }

        if (!token) {
            workflow.emit('error-handler', 'Token of User is required!');
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
                    workflow.emit('error-handler', 'Id of User is required');
                } else {
                    workflow.emit('unlike-event', idUser);
                }
            }
        });
    });

    workflow.on('error-handler', (err) => {
        socket.emit('unlike-event', [{ 'error': err }]);
    });

    workflow.on('unlike-event', (idUser) => {
        User.findById(idUser, (err, user) => {
            let likes = user.liked
            if (!likes) {
                return
            }

            let index = user.liked.indexOf(idEvent)
            if (index !== -1) { // co 
                user.liked.splice(index, 1)
                user.save((err) => {
                    if (err) {
                        workflow.emit('error-handler', err);
                    } else {
                        getLikedEvents(io, socket, token);
                    }
                });
            } 
        });
    });
    workflow.emit('validate-parameters');
}

module.exports = {
    newEvent: newEvent,
    getEvents: getEvents,
    uploadImageCover: uploadImageCover,
    router: router,
    like: like,
    unlike: unlike,
    getLikedEvents: getLikedEvents
}

