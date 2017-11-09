var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.io.emit("socketToMe", "users");
  res.render('index', { title: 'This is user page' });
});

module.exports = router;
