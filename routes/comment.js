'use strict';
const { Router } = require('express')
const AV = require('leanengine');
const router = module.exports = new Router

//post a comment
router.post('/post', async function (req, res, next) {
    const { productId, parentId, authorId, text, type, tweetId } = req.body
    let Comment = AV.Object.extend('Comment')
    let comment = new Comment()
    if (type == 'product') {

        let parentPointer = null
        if (parentId != null) { parentPointer = AV.Object.createWithoutData('Comment', parentId) }
        let productPointer = AV.Object.createWithoutData('Product', productId)
        let authorPointer = AV.Object.createWithoutData('_User', authorId)
        comment.set('productId', productPointer)
        comment.set('parentId', parentPointer)
        comment.set('authorId', authorPointer)
        comment.set('text', text)
        comment.set('type', type)
        await comment.save()
        res.json({
            'status': 'success',
            comment
        })
    } else {
        let parentPointer = null
        if (parentId != null) { parentPointer = AV.Object.createWithoutData('Comment', parentId) }
        let twitterPointer = AV.Object.createWithoutData('Tweet', tweetId)
        let authorPointer = AV.Object.createWithoutData('_User', authorId)
        comment.set('tweetId', twitterPointer)
        comment.set('parentId', parentPointer)
        comment.set('authorId', authorPointer)
        comment.set('text', text)
        comment.set('type', type)
        await comment.save()
        res.json({
            'status': 'success',
            comment
        })
    }
})

//get comment by the product id. /url/comment?productId=xxxx
router.get('/', async function (req, res, next) {
    const { productId } = req.query
    if (productId != null) {
        let product = AV.Object.createWithoutData('Product', productId)
        let query = new AV.Query('Comment')
        query.equalTo('productId', product)
        query.include('productId')
        query.include('authorId')
        query.include('parentId')
        let comments = await query.find()
        res.json({
            comments
        })
    } else {
        res.json({
            'status': "error",
            'code': "400",
            "reason": "No product id is provided"
        })
    }
})




//get the comment by their parent comment's id
router.post('/parent', async function (req, res, next) {
    const { parentId } = req.body
    if (parentId != null) {
        let parent = AV.Object.createWithoutData('Comment', parentId)
        let query = new AV.Query('Comment')
        query.equalTo('parentId', parent)
        query.include('productId')
        query.include('authorId')
        query.include('parentId')
        let comments = await query.find()
        res.json({
            comments
        })
    } else {
        res.json({
            'status': "error",
            'code': "400",
            "reason": "No parent id is provided"
        })
    }
})


// /url/comment/tweet?tweetId=XXX
router.get('/tweet', async function (req, res, next) {
    const { tweetId } = req.query
    console.log(tweetId)
    if (tweetId) {
        let query = new AV.Query('Comment')
        let tweetPointer = AV.Object.createWithoutData('Tweet', tweetId)
        query.equalTo('tweetId', tweetPointer)
        query.include('tweetId')
        query.include('tweetId.image')
        query.include('authorId')
        query.include('parentId')
        let comments = await query.find()
        res.json({
            comments
        })

    } else {
        res.json({
            'status': "error",
            'code': '400',
            'reason': "No tweet id is not provided "

        })
    }
})

module.exports = router;