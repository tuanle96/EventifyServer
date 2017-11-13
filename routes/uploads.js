var express = require('express');
var router = express.Router();
var fs = require('fs');

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'This is uploads page' });
});

router.get('/Images/Events/Cover/:path', (req, res) => {
    var path = req.params.path;
    let originUrl = '.' + req.client.parser.incoming.originalUrl  
    if (fs.existsSync(originUrl)) {

        res.download(originUrl, path , (err) => {
            if (err) {
                return res.json(err);
            }
        });

    } else {
        res.render('index', { title: path });
    }
});

// var img = fs.readFileSync('./public/images/img.gif');

//   if (para == '{id}') {
//     res.writeHead(200, {
//       'Content-Type': 'image/gif'
//     });
//     res.end(img, 'binary');

module.exports = router;

