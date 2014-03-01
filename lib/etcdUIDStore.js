var Etcd = require('node-etcd');


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
      if (parseInt(resp.node.value) >= UID) return callback();
      options.prevIndex = resp.node.modifiedIndex;
    }
    self.etcd.set(self.path, UID, options, function(err) {
      if (err) {
        console.error('got etcd set err. UID:', UID, ', get resp:', resp, ', err:', err);
        if (retries > 0) {
          // retry soon with some fuzz to prevent a situation where everyone is
          // trying to update at the same time
          // chances are, if there was any contention, when we return we'll
          // either come in before the person ahead of us in which case, they'll
          // silently stop (because their UID will be to low), or the opposite.
          return setTimeout(
            self.setLatestUID.bind(self, UID, callback, retries-1),
            1000*Math.random()
          );
        }
        else {
          console.error('retried too many times, failing...');
        }
      }
      return callback(err);
    });
  });
};

module.exports = etcdUIDStore;
