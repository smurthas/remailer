var S3UIDStore = require('s3UIDStore');
var etcdUIDStore = require('etcdUIDStore');

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
  }
}

UIDStore.prototype.getLatestUID = function(callback) {
  this.impl.getLatestUID(callback);
};

UIDStore.prototype.setLatestUID = function(UID, callback) {
  this.impl.setLatestUID(UID, callback);
};



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


module.exports = UIDStore;
