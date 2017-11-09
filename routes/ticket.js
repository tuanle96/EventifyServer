var express = require('express');
var router = express.Router();
var ticket = require('../apps/event/index').ticket;
var authenticate = require('../apps/middlewares/index').authenticate;

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'This is ticket page' });
  });

module.exports = router;