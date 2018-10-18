const schedule = require('node-schedule');
const http = require('./../utils/httpUtils.js');
const mem = require('./../utils/mem.js');

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
    logger.debug('Refresh component_access_token result: ' + component_access_token_result);

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
    logger.debug('Refresh pre_auth_code result: ' + component_preauthcode_result);
    if(preauthcode_json.errcode != undefined) {
        return;
    }
    auth_code = preauthcode_json.pre_auth_code;
    await mem.set("component_auth_code",auth_code,30*60)
}

//refresh component_access_token every hour
var refreshComponentAccessTokenJob = schedule.scheduleJob('0 0 */1 * * *', refreshComponentAccessToken);

//refresh pre_auth_code every 20 minutes
var refreshComponentAuthCodeJob = schedule.scheduleJob('10 */20 * * * *', refreshComponentAuthCode);
