var express = require('express');
var router = express.Router();

let user = require('../apps/user/index').user
let authenticate = require('../apps/middlewares/index').authenticate

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'This is user page' });
});

module.exports = router;