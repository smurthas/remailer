var redis = require('redis');
var url = require('url');

function redisUIDStore(options) {
  var redisURL = url.parse(options.url);
  this.client = redis.createClient(redisURL.port, redisURL.hostname,
                                  {no_ready_check: true});
  if (redisURL.auth) this.client.auth(redisURL.auth.split(":")[1]);
  this.key = options.key || 'uids';
}

redisUIDStore.prototype.getLatestUID = function(callback) {
  this.client.zrevrange(this.key, 0, 0, function(err, reply) {
    if (err) return callback(err, reply);
    var uid = parseInt(reply);
    if (isNaN(uid)) return callback('NaN');
    callback(null, uid);
  });
};

redisUIDStore.prototype.setLatestUID = function(UID, callback) {
  this.client.zadd(this.key, UID, UID, callback);
};

redisUIDStore.prototype.clear = function(callback) {
  this.client.del(this.key, callback);
};

module.exports = redisUIDStore;
