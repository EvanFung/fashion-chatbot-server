'use strict';
const { Router } = require('express')
const AV = require('leanengine');
const router = module.exports = new Router

router.get('/', async function (req, res, next) {
    // let query = new AV.Query('_User')
    // let users = await query.find()
    // console.log(users)
    // let profilePic = AV.Object.createWithoutData('_File', '5e836db38a84ab008cd35b8f')
    // console.log(users.length)
    // users.forEach(function (user, index) {
    //     user.set('profilePic', profilePic)
    //     user.save()
    // })
    res.json({
        'hello': 'This is social platform API'
    })
});

router.post('/follow', async function (req, res, next) {
    const { followerSessionId, followeeId } = req.body;
    //login success.
    let currentUser = await AV.User.become(followerSessionId);
    let result = await currentUser.follow(followeeId);
    res.json({ 'follow': 'success' });
})

router.post('/unfollow', async function (req, res, next) {
    const { followerSessionId, followeeId } = req.body
    let currentUser = await AV.User.become(followerSessionId);
    currentUser.unfollow(followeeId)
    res.json({ 'unfollow': 'success' })
})

//查询自己关注的列表
router.post('/queryFollowees', async function (req, res, next) {
    const { followerSessionId } = req.body
    let currentUser = await AV.User.become(followerSessionId)
    let query = currentUser.followeeQuery()
    query.include('followee')
    let followees = await query.find();
    res.json({
        'followees': followees
    })
})

//查看收件箱未读状态的数目
router.post('/countUnreadStatus', async function (req, res, next) {
    const { followerSessionId } = req.body
    let currentUser = await AV.User.become(followerSessionId)
    let result = await AV.Status.countUnreadStatuses(currentUser);
    res.json({
        'total': result.total,
        'unread': result.unread,
    })
})

//查询自己的粉丝列表
router.post('/queryFollower', async function (req, res, next) {
    const { followerSessionId } = req.body
    let currentUser = await AV.User.become(followerSessionId)
    let query = currentUser.followerQuery()
    query.include('follower')
    let followers = await query.find()
    res.json({
        'followers': followers
    })
})

//当前登录用户发送一条Status给关注他的粉丝
router.post('/sendStatus', async function (req, res, next) {
    const { followerSessionId, tweet } = req.body
    let queryTweet = new AV.Query('Tweet')
    queryTweet.equalTo('objectId', tweet['objectId'])
    queryTweet.include('createBy')
    queryTweet.include('image')

    let thisTweet = await queryTweet.first()
    let authorName = thisTweet.get('createBy').get('username')
    let imageUrl = thisTweet.get('image').get('url')
    let tweetPointer = AV.Object.createWithoutData('Tweet', tweet['objectId'])
    var status = new AV.Status(imageUrl, thisTweet.get('description'));
    status.set('authorName', authorName)
    status.set('likes', thisTweet.get('likes'))
    status.set('imageID', thisTweet.get('image').get('objectId'))
    status.set('creatorID', thisTweet.get('createBy').get('objectId'))
    status.set('tweet', tweetPointer)
    status.set('location', thisTweet.get('location'))
    let result = await AV.Status.sendStatusToFollowers(status, { "sessionToken": followerSessionId })
    res.json({
        'status': 'success sent a tweet!',
        result,
        thisTweet
    })
})

//发送私人信件给某个用户
router.post('/sendPrivateStatus', async function (req, res, next) {
    const { followerSessionId, receiverId } = req.body
    let status = new AV.Status(null, 'secret');
    AV.Status.sendPrivateStatus(status, receiverId, { 'sessionToken': followerSessionId }).
        then(function (status) {
            //发送成功
            console.dir(status);
        }, function (err) {
            //发布失败
            console.dir(err);
        });
    res.json({
        'status': 'success',
    })
})

//查询收件箱
router.post('/queryInbox', async function (req, res, next) {
    const { followerSessionId } = req.body
    let currentUser = await AV.User.become(followerSessionId)
    let query = AV.Status.inboxQuery(currentUser)
    query.include('tweet')
    query.include('source')
    let statuses = await query.find();
    res.json({
        statuses
    })
})


router.post('/queryInboxAndSendingBox', async function (req, res, next) {
    const { followerSessionId } = req.body
    let currentUser = await AV.User.become(followerSessionId)
    let queryInbox = AV.Status.inboxQuery(currentUser)
    let querySendingBox = AV.Status.statusQuery(currentUser)
    queryInbox.sinceId()
    let inboxStatus = await queryInbox.find()
    console.log(inboxStatus)
    let sendingStatus = await querySendingBox.find()
    console.log(sendingStatus)
    let combinedStatus = [...inboxStatus, ...sendingStatus];
    res.json({
        'statuses': combinedStatus
    })
})


//查询发件箱
router.post('/querySendingInbox', async function (req, res, next) {
    const { followerSessionId } = req.body
    let currentUser = await AV.User.become(followerSessionId)
    let query = AV.Status.statusQuery(currentUser);
    query.find().then(function (statuses) {
        //查询成功，返回状态列表，每个对象都是 AV.Object
        console.log(statuses)
    }, function (err) {
        //查询失败
        console.dir(err);
    });
    res.json({
        'status': 'success',
    })
})




module.exports = router;
