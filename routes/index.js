const xmlUtil = require("./../utils/xmlUtil.js");
const componentService = require('./../service/componentService.js');

//Be called every 10 minutes to refresh component_verify_ticket by wechat
//Be called when authorized
//Be called when unauthorized
//Be called when refresh
var handleComponentMessage = async (ctx, next) => {
    console.log("--------------ctx.request.body--------------")
    console.log(ctx.request.body)
    console.log("--------------ctx.req.body--------------")
    console.log(ctx.req.body)
    let requestString = ctx.request.body;
    let requestMessage = xmlUtil.formatMessage(requestString.xml);
    let query = ctx.query;
    let result = await componentService.handleComponentMessage(requestMessage, query);
    ctx.response.body = 'success';
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

const router = require('koa-router')()
router.get('/componentAuthorize',componentAuthorize);
router.get('/queryAuthorizeInfo',queryAuthorizeInfo);
router.post('/auth',handleComponentMessage);

router.get('/index',async function (ctx, next) {
    await ctx.render('index');
})

module.exports = router