var io = require('socket.io')();
let User = require('../apps/user/index').user;
let Ticket = require('../apps/ticket/index').ticket;
let Event = require('../apps/event/index').event;
let Type = require('../apps/type/index').type;
let Order = require('../apps/order/index').order;


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
    socket.on('sign-in-with-facebook', (FBToken) => {
        console.log(socket.id + " sign-in-with-facebook");
        User.loginWithFacebook(io, socket, FBToken);
    });

    //sign in with google plus
    socket.on('sign-in-with-google-plus', (GGToken) => {
        console.log(socket.id + " sign-in-with-facebook");
        User.loginWithGooglePlus(io, socket, GGToken);
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
    socket.on('like-event', (idEvent, token) => {
        console.log(socket.id + ' like-event');
        Event.like(io, socket, idEvent, token);
    });

    //unlike event
    socket.on('unlike-event', (idEvent, token) => {
        console.log(socket.id + ' unlike-event');
        Event.unlike(io, socket, idEvent, token)
    });

    //new order event
    socket.on('new-order', (data) => {

    });

    //get informations
    socket.on('get-informations', (token) => {
        console.log(socket.id + " get-informations");
        User.getInformations(io, socket, token)
    });

    socket.on('get-liked-events', (token) => {
        console.log(socket.id + " get-liked-events")
        Event.getLikedEvents(io, socket, token)
    })

    //get informations with id
    socket.on('get-informations-with-id', (data) => {

    });

    //get liked events
    socket.on('get-liked-events', (data) => {

    });

    //get orders 
    socket.on('get-orders', (data) => {

    });

    //updateAvatarUser
    socket.on('upload-image-user', (imgData, imgPath, token) => {
        console.log(socket.id + " upload-image-user")
        User.updateAvatarUser(io, socket, imgData, imgPath, token);
    });


    /**====================================================
     * Events Routers
     * 
     *=====================================================
     */

    socket.on('get-events', (token) => {
        console.log(socket.id + " get-events")
        Event.getEvents(io, socket, token)
    });

    socket.on('get-previous-events', (token) => {
        console.log(socket.id + " get-previous-events")
        Event.getPreviousEvents(io, socket, token)
    });

    socket.on('get-more-events', (from, token) => {
        console.log(socket.id + " get-more-events")
        Event.getMoreEvents(io, socket, from, token)
    });

    socket.on('get-more-previous-events', (from, token) => {
        console.log(socket.id + " get-more-previous-events")
        Event.getMorePreviousEvents(io, socket, from, token)
    });

    socket.on('get-event', (idEvent, token) => {
        console.log(socket.id + " get-event")
        Event.getEvent(io, socket, idEvent, token)
    });

    socket.on('new-event', (event, token) => {
        console.log(socket.id + " new-event")
        Event.newEvent(io, socket, event, token)
    });

    socket.on('upload-image-cover-event', (data, pathName, token) => {
        //console.log(data + " | " + pathName + " | " + token)
        console.log(socket.id + 'upload-image-cover-event');
        Event.uploadImageCover(io, socket, data, pathName, token);
    });

    socket.on('upload-image-description-event', (imgData, imgPath, token) => {
        //console.log(data + " | " + pathName + " | " + token)
        console.log(socket.id + 'upload-image-description-event');
        Event.uploadDescriptionImageEvent(io, socket, imgData, imgPath, token); 
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

    socket.on('get-detail-tickets', (idEvent, token) => {
        console.log(socket.id + " get-detail-tickets")
        Ticket.getTicketsByEvent(null, socket, idEvent, token);
    });


    /**====================================================
     * Types of Event Routers
     * 
     *=====================================================
     */

    socket.on('get-types', (token) => {
        console.log(socket.id + " get-types");
        Type.getTypes(io, socket, token);
    });

    /**====================================================
    * Order Routers
    * 
    *=====================================================
    */

    socket.on('begin-order', (order, token) => {
        console.log(socket.id + " order-Session");
        Order.beginOrder(io, socket, order, token);
    });

    socket.on('order', (order, token) => {
        console.log(socket.id + " order");
        Order.order(io, socket, order, token);
    });

    socket.on('cancel-order', (id, token) => {
        console.log(socket.id + " cancel-order");
        Order.cancelOrder(io, socket, id, token);
    });

    socket.on('get-orders', (token) => {
        console.log(socket.id + " get-orders");
        Order.getOrdersByToken(io, socket, token);
    });

    socket.on('get-order', (id, token) => {
        console.log(socket.id + " get-order");
        Order.getOrderById(io, socket, id, token);
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