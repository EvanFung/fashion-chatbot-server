'use strict';
const { Router } = require('express')
const AV = require('leanengine');
const router = module.exports = new Router

router.get('/', async function (req, res, next) {
    res.json({
        'hello': 'world'
    })
})

//add tweet
router.post('/', async function (req, res, next) {
    //createBy is user object id
    //image is file id
    const { createBy, description, image, likes, location, } = req.body
    let createByPointer = AV.Object.createWithoutData('_User', createBy)
    let imagePointer = AV.Object.createWithoutData('_File', image)
    let Tweet = AV.Object.extend('Tweet')
    let tweet = new Tweet()
    tweet.set('createBy', createByPointer)
    tweet.set('image', imagePointer)
    tweet.set('description', description)
    tweet.set('likes', likes)
    tweet.set('location', location)
    let savedTweet = await tweet.save()
    res.json({
        'status': 'susscess',
        'tweet': savedTweet
    })
})

router.delete('/', async function (req, res, next) {
    const { tweetID } = req.body
    let tweet = AV.Object.createWithoutData('Tweet', tweetID);
    await tweet.destroy();
    res.json({
        'status': 'susscess',
        'message': 'Tweet has been destroy',
    })
})

module.exports = router;
