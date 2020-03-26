'use strict';
const { Router } = require('express')
const AV = require('leanengine');
const router = module.exports = new Router

//Get the number of rating.
router.get('/', async function (req, res, next) {
    let productId = req.query.productId
    let query = new AV.Query('Rating')
    query.equalTo('productId', productId)
    let ratings = await query.find()
    let five = 0;
    let four = 0;
    let three = 0;
    let two = 0;
    let one = 0;
    ratings.forEach(function (rating, index) {
        if (rating.get('rating') === 5) {
            five++;
        }
        if (rating.get('rating') === 4) {
            four++;
        }
        if (rating.get('rating') === 3) {
            three++;
        }
        if (rating.get('rating') === 2) {
            two++;
        }
        if (rating.get('rating') === 1) {
            one++;
        }
    })
    res.json({
        five,
        four,
        three,
        two,
        one
    })
});



module.exports = router;
