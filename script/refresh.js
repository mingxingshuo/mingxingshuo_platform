const schedule = require('node-schedule');
const http = require('./../utils/httpUtils.js');

//refresh component_access_token every 1 hour
var refreshComponentAccessToken = async function() {
    var component = '读取表component';
    var ticket = component.component_ticket;

    if(ticket == null || ticket == undefined || ticket == '') {
        return;
    }
    var access_token = component.component_access_token;
    var auth_code = component.component_auth_code;

    var componentTokenPostData = {
        component_appid : '第三方appID',
        component_appsecret : '第三方appSecret',
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

    //TODO 将拿到的access_token 更新存储到数据表component中
}

//refresh pre_auth_code every 20 minutes
var refreshComponentAuthCode = async function() {
    var component = 读取表component;
    var ticket = component.component_ticket;
    var access_token = component.component_access_token;

    if(access_token == null || access_token == undefined || access_token == '') {
        return;
    }

    var access_token_times = component.component_access_token_times;
    var auth_code = component.component_auth_code;
    var auth_code_times = component.component_auth_code_times;

    var componentAuthCodePostData = {
        component_appid : config.component.appID
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

    //TODO 将拿到的pre_auth_code 更新存储到数据表component中
}

//refresh component_access_token every hour
//var refreshComponentAccessTokenJob = schedule.scheduleJob('0 0 */1 * * *', refreshComponentAccessToken);

//refresh pre_auth_code every 20 minutes
//var refreshComponentAuthCodeJob = schedule.scheduleJob('10 */20 * * * *', refreshComponentAuthCode);
