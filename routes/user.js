var express = require('express');
var router = express.Router();
var user = require('../apps/user/index').user;
var authenticate = require('../apps/middlewares/index').authenticate;

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'This is user page' });
  });

module.exports = router;