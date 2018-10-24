const xmlUtil = require("./../utils/xmlUtil.js");
const componentService = require('./../service/componentService.js');
const ComponentUserModel = require("./../model/ComponentUser.js")
const authModel = require("./../model/AuthorizationInfo.js")
const httpUtil = require("./../utils/httpUtils.js");
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
    let user = {
        open_id : message.FromUserName,
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
    console.log("-------user--------")
    console.log(user)

    ComponentUserModel.findOneAndUpdate(
        { "open_id" : message.FromUserName,
        "appid" : appid
        },
        user,
        {upsert: true},function(err){
            console.log(err)
        })
    //用户回复
    ctx.response.body = '';
    console.log('回复完了')
}

var send_text = async (ctx,next) =>{
    var data = {
        "touser" : 'o1U2E1E06mVsdIEs3Gg05EOP7BS0',
        "msgtype":"text",
        "text":
        {
             "content":"测试客服消息"
        }
    }
    let https_options = {
        hostname : 'api.weixin.qq.com',
        path : '/cgi-bin/message/custom/send?access_token=%ACCESS_TOKEN%',
        method : 'POST'
    };

    var auth= await authModel.findOne({});
    var access_token = auth.authorizer_access_token
    console.log('--------access_token---------')
    console.log(access_token)
    https_options.path = https_options.path.replace('%ACCESS_TOKEN%', access_token);
    
    var body = await httpUtil.doHttps_withdata(https_options,data)
    console.log(body)
    ctx.response.body = '客服消息发生完毕';
}

var send_all_text = async (ctx,next)=>{
    var data = {
        "touser" : [
            'o1U2E1E06mVsdIEs3Gg05EOP7BS0',
            'o1U2E1DGuUvpiFDORvQzctKthr60',
            'ozy4qt5QUADNXORxCVipKMV9dss0'
        ],
        "msgtype":"text",
        "text":
        {
             "content":"测试根据openid列表群发消息"
        }
    }

    let https_options = {
        hostname : 'api.weixin.qq.com',
        path : '/cgi-bin/message/mass/send?access_token=%ACCESS_TOKEN%',
        method : 'POST'
    };

    var auth= await authModel.findOne({});
    var access_token = auth.authorizer_access_token
    https_options.path = https_options.path.replace('%ACCESS_TOKEN%', access_token);
    var body = await httpUtil.doHttps_withdata(https_options,data)
    console.log(body)
    ctx.response.body = body;

}

const router = require('koa-router')()
router.get('/componentAuthorize',componentAuthorize);
router.get('/queryAuthorizeInfo',queryAuthorizeInfo);
router.post('/auth',xml_msg,handleComponentMessage);
router.post('/message/:appid/callback',xml_msg,message);
router.get('/send_text',send_text);
router.get('/send_all_text',send_all_text);

router.get('/',async function (ctx, next) {
    await ctx.render('index');
})


module.exports = router