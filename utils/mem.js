var Memcached = require('memcached');
var memcached = new Memcached('127.0.0.1:11211');

module.exports.get = function(key){
    return new Promise((resolve, reject)=>{
        memcached.get(key,function(err,value){
            resolve(value);
        });
    });
}

module.exports.set = function(key,value,time){
    return new Promise((resolve, reject)=>{
        memcached.set(key,value,time,function(err,value){
            resolve(value);
        });
    });
}
