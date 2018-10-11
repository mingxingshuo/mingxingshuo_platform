const xml2js = require('xml2js');
const xmlUtil = require("./../utils/xmlUtil.js");
const wechatCrypto = require('./../utils/cryptoUtil.js');


//analyze the decrypted message (xml => json)

var resolveMessage = messageXML => {
    var message = new Promise((resolve, reject) => {
            xml2js.parseString(messageXML, {trim: true}, (err, result) => {
            var message = xmlUtil.formatMessage(result.xml);
            resolve(message);
        });
    }).then(function(message) {
        return message;
    });

    return message;
};

var handleComponentMessage = async (requestMessage, query) => {
    let signature = query.msg_signature;
    let timestamp = query.timestamp;
    let nonce = query.nonce;
    logger.debug("Receive messasge from weixin \nsignature: " + signature + "\ntimestamp: " + timestamp + "\nnonce: " + nonce);

    //Create cryptor object for decrypt message
    let cryptor = new wechatCrypto('真实的token', '真实的encodingAESKey', '真实的第三方平台appID');
    let encryptMessage = requestMessage.Encrypt;
    let decryptMessage = cryptor.decrypt(encryptMessage);

    logger.debug('Receive messasge from weixin decrypted :' + JSON.stringify(decryptMessage));

    var message = await resolveMessage(decryptMessage.message);
    let infoType = message.InfoType;
    if(infoType == 'component_verify_ticket') {
        let ticket = message.ComponentVerifyTicket;
         //query the component_verify_ticket, component_access_token and component_auth_code
        
        //TODO 将拿到的ticket更新存储到数据表component中
    } else if(infoType == 'authorized') {
        //TODO authorized
    } else if(infoType == 'unauthorized') {
        //TODO unauthorized
    } else if(infoType == 'refresh') {
        //TODO refresh
    }

    return '';
}



let getAuthorizeUrl = async function() {
    let component = '读取表component';
    let url = 'https://mp.weixin.qq.com/cgi-bin/componentloginpage?component_appid=%APPID%&pre_auth_code=%AUTH_CODE%&redirect_uri=%REDIRECT_URI%'
        .replace('%APPID%', '第三方平台appID')
        .replace('%AUTH_CODE%', component.component_auth_code)
        .replace('%REDIRECT_URI%', 
            /*要跳转到的页面*/
            'http://www.xxxxxxx.com/queryAuthorizeInfo');
    return url;
}

let queryAuthorizeInfo = async (auth_code) => {
    var component = '读取表component';
    var access_token = component.component_access_token;

    let queryAuthorizePostData = {
        component_appid : '第三方平台appID',
        authorization_code : auth_code
    };
    let https_options = {
        hostname : 'api.weixin.qq.com',
        path : config.'/cgi-bin/component/api_query_auth?component_access_token=%ACCESS_TOKEN%',
        method : 'POST'
    };

    https_options.path = https_options.path.replace('%ACCESS_TOKEN%', access_token);
    let queryAuthorizeResult = await http.doHttps_withdata(https_options, queryAuthorizePostData);
    let queryAuthorize_json = JSON.parse(queryAuthorizeResult);
    console.log(queryAuthorize_json);

    let authorization_info = queryAuthorize_json.authorization_info;

    let appid = authorization_info.authorizer_appid;
    access_token = authorization_info.authorizer_access_token;
    let expires_in = authorization_info.expires_in;
    let refresh_token = authorization_info.authorizer_refresh_token;
    let func_info = JSON.stringify(authorization_info.func_info);

    /*
    let authorizers = await 授权数据表操作类.queryAuthorizerByAppID(appid);
    //存在则更新，不存在则新建表项
    if(authorizers.length == 0) {
        let authorizerResult = await 授权数据表操作类.saveAuthorizer(appid, access_token, refresh_token, expires_in, func_info);
    } else {
        let authorizerResult = await 授权数据表操作类.updateAuthorizer(appid, access_token, refresh_token, expires_in, func_info);
    }
*/
    return authorization_info;
}

module.exports = {
    getAuthorizeUrl : getAuthorizeUrl,
    queryAuthorizeInfo : queryAuthorizeInfo
}
