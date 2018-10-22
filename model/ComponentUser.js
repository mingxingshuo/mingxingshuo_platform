var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var connect_url = require('../conf/proj.json').mongodb;
var db = mongoose.createConnection(connect_url); 

var ComponentUserSchema = new Schema({
		appid:String,
	    open_id:String,
	    action_time:Number,
		subscribe_time:Number,
		unsubscribe_time:Number,
		subscribe_flag: {type:Boolean,default:true},
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

var ComponentUserModel = db.model('ComponentUser', ComponentUserSchema);
module.exports = ComponentUserModel;