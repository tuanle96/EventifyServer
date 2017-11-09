var express = require('express');
var router = express.Router();
var authenticate = require('../apps/middlewares/index').authenticate;

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'This is homepage' });
});

module.exports = router;