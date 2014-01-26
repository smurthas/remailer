module.exports.load = function load(source, options, callback) {
  switch(source) {
    case 'etcd':
      loadEtcd(options, callback);
      break;
    default:
      loadEnv(callback);
      break;
  }
};

function loadEtcd(host, callback) {
  var Etcd = require('node-etcd');
  var etcd = new Etcd(host);
  etcd.get('/stdinbox/config', function(err, value) {
    if (err) return callback(err, value);
    var info = value && value.node && value.node.value;
    if (!info) return callback('no config found', value);
    info = JSON.parse(info);
    for (var i in info) module.exports[i] = info[i];
    callback();
  });
}

function loadEnv(callback) {
  for(var i in process.env) module.exports[i] = process.env[i];
  setImmediate(callback);
}
