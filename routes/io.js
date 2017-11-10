var io = require('socket.io')();
let User = require('../apps/user/index').user


/**
 * Index
 */

var index = io.of('/').on('connection', (socket) => {
    console.log('/index: ' + socket.id + " connected!");

    socket.on('disconnect', () => {
        console.log('/index: ' + socket.id + " disconnected!");
    });
});

/**
 * Users router
 */

var user = io.of('/user').on('connection', (socket) => {
    console.log(socket.id + " connected");

    //sign in with email and password
    socket.on('sign-in', (data) => {
        User.login(io, socket, data);  
    });

    //sign in with facebook
    socket.on('sign-in-with-facebook', (data) => {

    });

    //sign in with google plus
    socket.on('sign-in-with-google-plus', (data) => {

    });

    //sign up
    socket.on('sign-up', (object) => {
        User.signUp(io, socket, object);
    });

    //update password
    socket.on('update-password', (data) => {

    });

    //update informations
    socket.on('update-informations', (data) => {

    });

    //sign out
    socket.on('sign-out', (data) => {

    });

    //like event
    socket.on('like-event', (data) => {

    });

    //unlike event
    socket.on('unlike-event', (data) => {

    });

    //new order event
    socket.on('new-order', (data) => {

    });

    //get informations
    socket.on('get-informations', (data) => {
        User.getInformations(io, socket, data)
    });

    //get informations with id
    socket.on('get-informations-with-id', (data) => {

    });

    //get liked events
    socket.on('get-liked-events', (data) => {

    });

    //get tickets
    socket.on('get-tickets', (data) => {

    });

    //get orders 
    socket.on('get-orders', (data) => {

    });

    //disconnect
    socket.on('disconnect', () => {
        console.log('/user: ' + socket.id + " disconnected!");
    });
});

var event = io.of('/event').on('connection', (socket) => {

});

module.exports = io;