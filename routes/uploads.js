var express = require('express');
var router = express.Router();
var fs = require('fs');
var QRCode = require('qrcode');

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'This is uploads page' });
});

router.get('/Images/Events/Cover/:path', (req, res) => {
    var path = req.params.path;
    let originUrl = '.' + req.client.parser.incoming.originalUrl
    if (fs.existsSync(originUrl)) {         
        res.download(originUrl, path, (err) => {  
            // if (err) {
            //     return res.json(err);
            // }
        });
    } else {
        res.render('index', { title: path });
    }
});

router.get('/Images/Events/Descriptions/:path', (req, res) => {
    var path = req.params.path;
    let originUrl = '.' + req.client.parser.incoming.originalUrl
    if (fs.existsSync(originUrl)) {         
        res.download(originUrl, path, (err) => {  

        });
    } else {
        res.render('index', { title: path });
    }
});

router.get('/Images/Orders/:path', (req, res) => {
    var path = req.params.path;
    console.log(path);
    let originUrl = '.' + req.client.parser.incoming.originalUrl
    console.log(originUrl);
    if (fs.existsSync(originUrl)) {
        res.download(originUrl, path, (err) => {
           
        });
    } else {

        //remove .png file extension
        let code = path.substring(0, path.length - 4);
        console.log(code);

        generateQrCode('uploads/Images/Orders/' + path, code, (err) => {
            if (err) {
                return res.json(err);
            }

            res.download(originUrl, path, (err) => {
                if (err) {
                    return res.json(err);
                }
            })
        })
    }
});

router.get('/Images/Users/:path', (req, res) => {
    var path = req.params.path;
    console.log(path);
    let originUrl = '.' + req.client.parser.incoming.originalUrl
    if (fs.existsSync(originUrl)) {
        res.download(originUrl, path, (err) => {
           
        });
    } else {

        //remove .png file extension
        let code = path.substring(0, path.length - 4);
        console.log(code);

        generateQrCode('uploads/Images/Orders/' + path, code, (err) => {
            if (err) {
                return res.json(err);
            }

            res.download(originUrl, path, (err) => {
                if (err) {
                    return res.json(err);
                }
            })
        })
    }
});

var generateQrCode = (path, code, callback) => {
    console.log(path);
    QRCode.toFile(path, code, {
        color: {
            dark: '#493f3f',  // Blue dots
            light: '#0000' // Transparent background
        }
    }, (err) => {
        if (err) {
            return callback(err);
        } else {
            return callback(null);
        }
    });

}

module.exports = router;

