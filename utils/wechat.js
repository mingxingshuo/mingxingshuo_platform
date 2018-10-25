const mem = require('./../utils/mem.js');
const authModel= require("./../model/AuthorizationInfo.js");

async function getAccessToken(appid){
	var access_token = await mem.get('access_token_'+appid);
	if(access_token){
		return access_token
	}
	var auth = await authModel.findOne({appid:appid});
	await mem.set('access_token_'+appid,auth.authorizer_access_token,30)
	return auth.authorizer_access_token;
}

module.exports={
	getAccessToken : getAccessToken
}