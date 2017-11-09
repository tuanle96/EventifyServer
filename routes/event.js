var express = require('express');
var router = express.Router();
var event = require('../apps/event/index').event;
var authenticate = require('../apps/middlewares/index').authenticate;

/* GET home page. */

router.get('/', function(req, res, next) {
    res.render('index', { title: 'This is event page' });
  });

module.exports = router;