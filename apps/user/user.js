'use strict';

var user = require('../models/index').user;
var jwt = require('jsonwebtoken');
const key = require('../config/index').key;

//login with email & password
var login = (req, res) => {
    console.log('SIGN IN')
}

//sign in with facebook
var loginWithFacebook = (req, res) => {

}
//sign in with google plus
var loginWithGooglePlus = (req, res) => {

}

//sign up with email & password
var signUp = (req, res) => {

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

