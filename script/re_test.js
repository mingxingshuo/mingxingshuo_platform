const refresh = require('./refresh.js');

refresh.refreshComponentAccessToken()
setTimeout(function () {
	refresh.refreshComponentAuthCode()
},3000)
