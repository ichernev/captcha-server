const express = require('express');
const svgCaptcha = require('svg-captcha');
const crypto = require('crypto');
const gm = require('gm').subClass({ imageMagick: true });
// const querystring = require('querystring');
// const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// app.use(bodyParser.urlencoded({ extended: false });

class Hasher {

    constructor() {
        this.key = crypto.randomFillSync(Buffer.alloc(16));
    }

    hash(text) {
        const hmacer = crypto.createHmac(this.constructor.algo, this.key);
        hmacer.update(text);
        return hmacer.digest('hex');
    }

    verify(text, hmac) {
        const expHmac = this.hash(text);
        if (hmac.length != expHmac.length) {
            return false;
        }
        return crypto.timingSafeEqual(Buffer.from(hmac, 'ascii'), Buffer.from(expHmac, 'ascii'));
    }
}
Hasher.algo = 'sha256';

const hasher = new Hasher();

app.use('/assets', express.static(__dirname + '/public'));
app.get('/', function (req, res) {
    console.log('serving /');
    res.send('Hello World');
});

function generate () {
    const captcha = svgCaptcha.create({
        size: 6,
        ignoreChars: 'oO01iI',
        noise: 2
    });

    return {
        svg: captcha.data,
        hmac: hasher.hash(captcha.text),
    };
}

function svg2b64png(svg, callback) {
    gm(Buffer.from(svg, 'ascii'), 'source.svg').toBuffer('PNG', (err, buf) => {
        if (err) {
            return callback(err);
        }
        callback(null, buf.toString('base64'));
    });
}

app.get('/generate', function (req, res) {
    const captchaData = generate();
    if (req.query.type === 'png') {
        svg2b64png(captchaData.svg, (err, png) => {
            if (!err) {
                captchaData.svg = null;
                captchaData.png = png;
            } else {
                res.status(500);
                res.send('failed to convert to png: ' + err.toString());
                return;
            }
            res.send(JSON.stringify(captchaData));
        });
    } else {
        res.send(JSON.stringify(captchaData));
    }
});

app.get('/test.html', function (req, res) {
    res.send('<html><head><script src="/assets/test.js"></script><head><body></body></html>');
});

app.get('/generate.html', function (req, res) {
    const captchaData = generate();

    res.send(`<html><body>${captchaData.svg}<pre>${captchaData.hmac}</pre></body></html>`);

});

app.get('/verify', function (req, res) {
    console.log(`/verify got query: ${JSON.stringify(req.query)}`);
    if (!(req.query.guess && req.query.hmac)) {
        res.status(400);
        res.send('missing guess or hmac attributes');
        return;
    }

    if (hasher.verify(req.query.guess, req.query.hmac)) {
        res.send('OK');
    } else {
        res.status(400);
        res.send('Error');
    }
});

app.listen(port, function() {
    console.log(`listening carefully to 0.0.0.0:${port}`);
});
