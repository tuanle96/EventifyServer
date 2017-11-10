var express = require('express');
var router = express.Router();
var app = require('../app').app
var io = require('../app').io

/* GET home page. */
router.get('/', (req, res, next) => {
    res.io.emit("home", "users");
    res.render('index', { title: 'This is homepage' });    
});

module.exports = router