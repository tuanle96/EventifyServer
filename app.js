'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request');
const socketio = require('socket.io');
const _ = require('underscore');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const app = express()

var index = require('./routes/index');
var user = require('./routes/user');
var event = require('./routes/event');
var ticket = require('./routes/ticket');

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "127.0.0.1");

const server = app.listen(app.get('port'), app.get('ip'), () => {
  console.log("Express server listening at %s:%d ", app.get('ip'), app.get('port'));
});

var io = socketio.listen(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

//set router
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use("/static", express.static(__dirname + "/public"));

//router
app.use('/', index)
app.use('/user', user)
app.use('/event', event)
app.use('/ticket', ticket)

//socket io
io.on('connection', (socket) => {
    console.log(socket.id + "da join")
});

