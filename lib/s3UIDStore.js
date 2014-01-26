var knox = require('knox');


function S3UIDStore(options) {
  this.path = 'stdinbox/' + options.user + '/' + options.box;
  this.client = knox.createClient(options.s3);
}


S3UIDStore.prototype.getLatestUID = function(callback) {
  this.client.getFile(this.path, function(err, res) {
    if (err) return callback(err);
    if (!res) return callback(new Error('no response from S3'));
    if (res.statusCode === 404) return callback();

    var buffers = [];
    res.on('data', function(data) { buffers.push(data); });
    res.on('error', function(err) {
      buffers = undefined;
      return callback(err);
    });
    res.on('end', function() {
      if (!buffers) return;
      var data = Buffer.concat(buffers);
      var UID = parseInt(data);
      if (isNaN(UID)) return callback('couldn\'t parse uid ' + data);
      return callback(null, UID);
    });

  });
};


S3UIDStore.prototype.setLatestUID = function(UID, callback) {
  if (typeof UID !== 'number' || UID < -1) {
    return callback(new Error('invalid UID, must be a number and greater than -2'));
  }
  this.client.putBuffer('' + UID, this.path, function(err, res) {
    if (err) return callback(err, res);
    if (!res) return callback(new Error('no response from S3'));
    res.resume();
    if (res.statusCode !== 200) {
      return callback(new Error('non-200 from S3: ' + res.statusCode), res);
    }
    return callback();
  });
};


module.exports = S3UIDStore;
