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

etcdUIDStore.prototype.setLatestUID = function(UID, callback, retries) {
  if (retries === undefined) retries = 3;
  var self = this;
  this.etcd.get(this.path, function(err, resp) {
    var options = {};
    if (!err && resp && resp.node) {
      console.error('resp.node', resp.node);
      if (parseInt(resp.node.value) >= UID) return callback();
      options.prevIndex = resp.node.modifiedIndex;
    }
    self.etcd.set(self.path, UID, options, function(err) {
      if (err) {
        console.error('got etcd set err. UID:', UID, ', get resp:', resp, ', err:', err);
        if (retries > 0) return self.setLatestUID(UID, callback, retries-1);
      }
      return callback(err);
    });
  });
};

module.exports = etcdUIDStore;
