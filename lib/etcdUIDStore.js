var Etcd = require('node-etcd');
var config = require('config');


function etcdUIDStore(options) {
  this.etcd = new Etcd(options.host, options.port);
  this.path = '/stdinbox/latestUID';
}

etcdUIDStore.prototype.getLatestUID = function(callback) {
  this.etcd.get(this.path, function(err, value) {
    if (err) return callback(err, value);
    callback(null, parseInt(value && value.node && value.node.value));
  });
};

etcdUIDStore.prototype.setLatestUID = function(UID, callback) {
  var self = this;
  this.etcd.get(this.path, function(err, resp) {
    var options = {};
    if (!err && resp && resp.node) {
      if (parseInt(resp.node.value) >= UID) return callback();
      options.prevIndex = resp.node.modifiedIndex;
    }
    self.etcd.set(self.path, UID, options, callback);
  });
};

module.exports = etcdUIDStore;
