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


router.post('/userId', async function (req, res, next) {
    const { userId } = req.body
    let query = new AV.Query('Tweet')
    let createBy = AV.Object.createWithoutData('createBy', userId)
    query.equalTo('createBy', createBy)
    query.include('createBy')
    query.include('image')
    let tweets = await query.find()
    res.json(
        {
            tweets
        }
    )
})

router.delete('/', async function (req, res, next) {
    const { tweetID } = req.body
    let tweet = AV.Object.createWithoutData('Tweet', tweetID);
    await tweet.destroy();
    res.json({
        'status': 'success',
        'message': 'Tweet has been destroy',
    })
})


router.post('/like', async function (req, res, next) {
    const { tweetID } = req.body
    console.log(tweetID)
    let tweet = AV.Object.createWithoutData('Tweet', tweetID)
    tweet.increment('likes', 1)
    await tweet.save()
    res.json({
        "status": "success",
        "message": "successfully update likes"
    })
})

module.exports = router;
