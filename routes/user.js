var express = require('express');
var router = express.Router();

let user = require('../apps/user/index').user
let authenticate = require('../apps/middlewares/index').authenticate

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'This is user page' });
});

//user
router.post('/sign-in', user.login);
router.post('/sign-in-with-facebook', user.loginWithFacebook);
router.post('/sign-in-with-google-plus', user.loginWithGooglePlus);
router.post('/sign-up', user.signUp);
router.post('/update-password', [authenticate.requireSession, user.updatePw]);
router.post('/update-informations', [authenticate.requireSession, user.updateInformations]);
router.post('/sign-out', user.signOut)
router.post('/like-event', [authenticate.requireSession, user.likeEvent]);
router.post('/unlike-event', [authenticate.requireSession, user.unlikeEvent]);
router.post('/new-order', [authenticate.requireSession, user.newOrder]);
router.get('/get-informations', [authenticate.requireSession, user.getInformations]);
router.get('/get-informations-with-id', [authenticate.requireSession, user.getInformationsWithId]);
router.get('/get-liked-events', [authenticate.requireSession, user.getLikedEvents]);
router.get('/get-tickets', [authenticate.requireSession, user.getMyTickets]);
router.get('/get-orders', [authenticate.requireSession, user.getMyOrders]);

module.exports = router;