var S3UIDStore = require('s3UIDStore');
var etcdUIDStore = require('etcdUIDStore');
var RedisUIDStore = require('redisUIDStore');

function MemoryUIDStore(UID) {
  this.UID = UID;
}

MemoryUIDStore.prototype.getLatestUID = function(callback) {
  setImmediate(callback.bind(this, null, this.UID));
};

MemoryUIDStore.prototype.setLatestUID = function(UID, callback) {
  if (UID > this.UID) this.UID = UID;
  setImmediate(callback);
};


function UIDStore(type, options) {
  switch(type) {
    case 's3':
      this.impl = new S3UIDStore(options);
      break;
    case 'mem':
      this.impl = new MemoryUIDStore(options);
      break;
    case 'etcd':
      this.impl = new etcdUIDStore(options);
      break;
    case 'redis':
      this.impl = new RedisUIDStore(options);
      break;
  }
}

UIDStore.prototype.getLatestUID = function(callback) {
  this.impl.getLatestUID(function(err, uid) {
    if (err) return callback(err, uid);
    if (uid === null || uid === undefined || parseInt(uid) < 0) {
      return callback('invalid UID', uid);
    }
    return callback(null, uid);
  });
};

UIDStore.prototype.setLatestUID = function(UID, callback) {
  this.impl.setLatestUID(UID, callback);
};

UIDStore.prototype.clear = function(callback) {
  if (!this.impl.clear instanceof Function) return callback('not implmented');
  this.impl.clear(callback);
};



module.exports = UIDStore;
