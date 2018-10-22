const xmlUtil = require("./../utils/xmlUtil.js");
const componentService = require('./../service/componentService.js');
const ComponentUserModel = require("./../model/ComponentUser.js")
//Be called every 10 minutes to refresh component_verify_ticket by wechat
//Be called when authorized
//Be called when unauthorized
//Be called when refresh
var handleComponentMessage = async (ctx, next) => {
    let requestString = ctx.request.body;
    let requestMessage = xmlUtil.formatMessage(requestString.xml);
    let query = ctx.query;
    let result = await componentService.handleComponentMessage(requestMessage, query);
    ctx.response.body = 'success';
}

var xml_msg = async function(ctx,next){
    if (ctx.method == 'POST' && ctx.is('text/xml')) {
            let promise = new Promise(function (resolve, reject) {
                let buf = ''
                ctx.req.setEncoding('utf8')
                ctx.req.on('data', (chunk) => {
                    buf += chunk
                })
                ctx.req.on('end', () => {
                    resolve(buf)
                })
            })

            await promise.then((result) => {
                    ctx.request.body.xml = result
                })
                .catch((e) => {
                    e.status = 400
                })
            next()
        } else {
            await next()
        }
}


var componentAuthorize = async (ctx, next) => {
    let url = await componentService.getAuthorizeUrl();
    ctx.redirect(url);
}

//授权后跳转到的页面
var queryAuthorizeInfo =  async (ctx, next) => {
    let query = ctx.query;
    let auth_code = query.auth_code;
    let expires_in = query.expires_in;

    let authorization_info = await componentService.queryAuthorizeInfo(auth_code);

    let html = '<html><body>'
        + '<p>auth_code = ' + query.auth_code + '</p>'
        + '<p>authorizer_appid = ' + authorization_info.authorizer_appid + '</p>'
        + '<p>access_token = ' + authorization_info.authorizer_access_token + '</p>'
        + '<p>refresh_token = ' + authorization_info.authorizer_refresh_token + '</p>'
        + '<p>func_info = ' + JSON.stringify(authorization_info.func_info) + '</p>'
        + '<p>expires_in = ' + query.expires_in + '</p>'
        + '</body></html>';

    ctx.response.type ='text/html';
    ctx.response.body = html;
};

var message = async (ctx, next)=>{
    let appid = ctx.params.appid;
    console.log('------appid-----');
    console.log(appid);
    let requestString = ctx.request.body;
    let requestMessage = xmlUtil.formatMessage(requestString.xml);
    let query = ctx.query;
    let message = await componentService.handleMessage(requestMessage, query);
    user = {
        openid : message.FromUserName,
        appid :appid,
        action_time : Date.now()
    }
    if(message.MsgType === 'event'){
        if(message.Event === 'subscribe'){
            user.subscribe_time =Date.now();
            user.subscribe_flag = true;   
        }else if(message.Event === 'unsubscribe'){
            user.unsubscribe_time =Date.now();
            user.subscribe_flag = false;
        }
    }
    await ComponentUserModel.findOneAndUpdate(
        {openid : message.FromUserName,appid :appid},
        user,
        {upsert: true})
    ctx.response.body = 'success';
}

const router = require('koa-router')()
router.get('/componentAuthorize',componentAuthorize);
router.get('/queryAuthorizeInfo',queryAuthorizeInfo);
router.post('/auth',xml_msg,handleComponentMessage);
router.post('/message/:appid/callback',xml_msg,message);

router.get('/index',async function (ctx, next) {
    await ctx.render('index');
})

module.exports = router