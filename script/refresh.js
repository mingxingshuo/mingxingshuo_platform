const schedule = require('node-schedule');
const http = require('./../utils/httpUtils.js');
const mem = require('./../utils/mem.js');
const authModel= require("./../model/AuthorizationInfo.js");

//refresh component_access_token every 1 hour
var refreshComponentAccessToken = async function() {
    var ticket = await mem.get('component_ticket');
    if(ticket == null || ticket == undefined || ticket == '') {
        return;
    }
    var componentTokenPostData = {
        component_appid : 'wx4b715a7b61bfe0a4',
        component_appsecret : '5d9db74768cbead3047ff8612ede5124',
        component_verify_ticket : ticket
    };
    var https_options = {
        hostname : 'api.weixin.qq.com',
        path : '/cgi-bin/component/api_component_token',
        method : 'post'
    };

    var component_access_token_result = await http.doHttps_withdata(https_options, componentTokenPostData);
    var access_token_json = JSON.parse(component_access_token_result);
    console.log('Refresh component_access_token result: ' + component_access_token_result);

    if(access_token_json.errcode != undefined) {
        return;
    }
    access_token = access_token_json.component_access_token;
    await mem.set("component_access_token",access_token,90*60)
}

//refresh pre_auth_code every 20 minutes
var refreshComponentAuthCode = async function() {
    var access_token = await mem.get("component_access_token");
    if(access_token == null || access_token == undefined || access_token == '') {
        return;
    }
    var componentAuthCodePostData = {
        component_appid : "wx4b715a7b61bfe0a4"
    };
    var https_options = {
        hostname : 'api.weixin.qq.com',
        path : '/cgi-bin/component/api_create_preauthcode?component_access_token=%ACCESS_TOKEN%',
        method : 'post'
    };

    https_options.path = https_options.path.replace('%ACCESS_TOKEN%', access_token);
    var component_preauthcode_result = await http.doHttps_withdata(https_options, componentAuthCodePostData);
    var preauthcode_json = JSON.parse(component_preauthcode_result);
    console.log('Refresh pre_auth_code result: ' + component_preauthcode_result);
    if(preauthcode_json.errcode != undefined) {
        return;
    }
    auth_code = preauthcode_json.pre_auth_code;
    await mem.set("component_auth_code",auth_code,30*60)
}

//账号比较多，有待优化的细节
var refreshAccessToken = async function(con={}) {
    var auths = await authModel.find(con)
    var access_token = await mem.get("component_access_token");
    var https_options = {
        hostname : 'api.weixin.qq.com',
        path : '/cgi-bin/component/api_authorizer_token?component_access_token=%ACCESS_TOKEN%',
        method : 'post'
    };
    https_options.path = https_options.path.replace('%ACCESS_TOKEN%', access_token);
    for (var i = 0; i <auths.length; i++) {
        try{
            var auth = auths[i];
            var post_data={
                component_appid : "wx4b715a7b61bfe0a4",
                authorizer_appid : auth.appid,
                authorizer_refresh_token : auth.refresh_token
            }
            var result = await http.doHttps_withdata(https_options, post_data);
            var data = JSON.parse(result);
            auth.authorizer_access_token = data.authorizer_access_token
            auth.expires_in = data.expires_in
            auth.refresh_token = auth.authorizer_refresh_token
            auth.save();
            await mem.set('access_token_'+auth.appid,auth.authorizer_access_token,30)
        }catch(e){
            console.log('-------refreshAccessToken err-------')
            console.log(e)
        }
    }
}

var get_authorizer_info = async function(con={}) {
   
    var  auths = await authModel.find(con)
   
    var access_token = await mem.get("component_access_token");
    var https_options = {
        hostname : 'api.weixin.qq.com',
        path : '/cgi-bin/component/api_get_authorizer_info?component_access_token=%ACCESS_TOKEN%',
        method : 'post'
    };
    https_options.path = https_options.path.replace('%ACCESS_TOKEN%', access_token);
    for (var i = 0; i <auths.length; i++) {
        try{
            var auth = auths[i];
            var post_data={
                component_appid : "wx4b715a7b61bfe0a4",
                authorizer_appid : auth.appid
            }
            var result = await http.doHttps_withdata(https_options, post_data);
            console.log('-------get_authorizer_info reslut-------')
            console.log(result)
            var info = JSON.parse(result).authorizer_info;
            auth.service_type_info_id = info.service_type_info.id;
            auth.verify_type_info_id = info.verify_type_info.id;
            auth.user_name = info.user_name;
            auth.qrcode_url = info.qrcode_url;
            auth.nick_name = info.nick_name;
            auth.save();
        }catch(e){
            console.log('-------get_authorizer_info err-------')
            console.log(e)
        }
    }
}

get_authorizer_info({appid:'wx2f289986bee197b2'})

function start(){
    //refresh component_access_token every hour
    var refreshComponentAccessTokenJob = schedule.scheduleJob('0 0 */1 * * *', refreshComponentAccessToken);

    //refresh pre_auth_code every 20 minutes
    var refreshComponentAuthCodeJob = schedule.scheduleJob('10 */20 * * * *', refreshComponentAuthCode);

    //refresh app access_token
    var refreshAPPAccessTokenJob = schedule.scheduleJob('30 0 */1 * * *', refreshAccessToken);

    //refresh app info
    var get_authorizer_infoJob = schedule.scheduleJob('0 0 2 * * *',get_authorizer_info)
}

module.exports = {
    refreshComponentAccessToken : refreshComponentAccessToken,
    refreshComponentAuthCode : refreshComponentAuthCode,
    refreshAccessToken : refreshAccessToken,
    get_authorizer_info : get_authorizer_info,
    start : start
}


