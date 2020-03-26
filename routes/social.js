'use strict';
const { Router } = require('express')
const AV = require('leanengine');
const router = module.exports = new Router

router.get('/', async function (req, res, next) {
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
    let followers = await query.find()
    res.json({
        'followers': followers
    })
})

//当前登录用户发送一条Status给关注他的粉丝
router.post('/sendStatus', async function (req, res, next) {
    const { followerSessionId, messages } = req.body
    console.log(messages)

    var status = new AV.Status('视频url', '我喜欢了视频xxxx.');
    status.set('sound', 'sound.wmv');
    AV.Status.sendStatusToFollowers(status, { "sessionToken": followerSessionId }).then(function (status) {
        //发布状态成功，返回状态信息
        console.dir(status);
    }, function (err) {
        //发布失败
        console.dir(err);
    });
    res.json({
        'status': 'success',
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
    query.find().then(function (statuses) {
        //查询成功，返回状态列表，每个对象都是 AV.Status
        console.log(statuses)
    }, function (err) {
        //查询失败
        console.dir(err);
    });
    res.json({
        'status': 'success',
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
