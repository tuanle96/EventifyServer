var io = require('socket.io')();
let User = require('../apps/user/index').user
let Ticket = require('../apps/ticket/index').ticket
let Event = require('../apps/event/index').event


/**
 * Index
 */

io.of('/').on('connection', (socket) => {

    /**
     * User routers
     */

    //sign in with email and password
    socket.on('sign-in', (data) => {
        console.log(socket.id + " sign-in");
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
        console.log(socket.id + " sign-up");
        User.signUp(io, socket, object);
    });

    //update password
    socket.on('update-password', (data) => {
        User.updatePw(io, socket, data.currentPw, data.newPw, data.token);
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
    socket.on('get-informations', (token) => {
        console.log(socket.id + " get-informations");
        User.getInformations(io, socket, token)
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


    /**====================================================
     * Events Routers
     * 
     *=====================================================
     */

    socket.on('get-events', (data) => {

    });

    socket.on('get-event', (data) => {

    });

    socket.on('new-event', (data) => {

    });




     /**====================================================
     * Ticket Routers
     * 
     *=====================================================
     */

    socket.on('new-ticket', (ticket, token) => {
        console.log(socket.id + " new-ticket");
        Ticket.newTicket(io, socket, ticket, token);
    });

    socket.on('get-tickets', (token) => {
        console.log(socket.id + " get-tickets");
        Ticket.getTickets(io, socket, token);
    });

    socket.on('delete-ticket', (idTicket, token) => {
        console.log(socket.id + " delete-ticket");
        Ticket.deleteTicket(io, socket, idTicket, token);
    });

    socket.on('edit-ticket', (ticket, token) => {
        console.log(socket.id + " edit-ticket")
        Ticket.editTicket(io, socket, ticket, token)
    });


    /**
     * Index
     */
    console.log('/index: ' + socket.id + " connected!");

    socket.emit('joined', { "status": "Ok" })

    socket.on('disconnect', () => {
        console.log('/index: ' + socket.id + " disconnected!");
    });
});

module.exports = io;