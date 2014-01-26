var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');


function FSUIDStore(options) {
  var dir = path.join(options.path, 'stdinbox', options.user);
  mkdirp.sync(dir);
  this.path = path.join(dir, options.box);
}

FSUIDStore.prototype.getLatestUID = function(callback) {
  fs.readFile(this.path, function(err, data) {
    return callback(err, parseInt(data.toString()));
  });
};

FSUIDStore.prototype.setLatestUID = function(UID, callback) {
  fs.writeFile(this.path, '' + UID, callback);
};

module.exports = FSUIDStore;
