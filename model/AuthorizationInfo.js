var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var connect_url = require('../conf/proj.json').mongodb;
var db = mongoose.createConnection(connect_url); 

var AuthorizationInfoSchema = new Schema({
		"appid":String,
	    "authorizer_access_token":String,
	    "expires_in":Number,
	    "refresh_token":String,
	    "func_info":String,
	    createAt: {
	      type: Date,
	      default: Date.now
		},
		updateAt: {
		    type: Date,
		    default: Date.now
		}
	},
	{
		timestamps: { createdAt: 'createAt', updatedAt: 'updateAt' }
	}
);

var AuthorizationInfoModel = db.model('AuthorizationInfo', AuthorizationInfoSchema);
module.exports = AuthorizationInfoModel;