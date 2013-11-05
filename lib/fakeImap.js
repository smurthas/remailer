var util = require('util');
var path = require('path');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;

var async = require('async');

var BASE_PATH = path.join('/data', 'imap');

function Imap(options) {
  this.dataPath = path.join(BASE_PATH, options.user);
  console.error('this.dataPath', this.dataPath);
}

util.inherits(Imap, EventEmitter);

Imap.prototype.getBoxes = function(callback) {
  return callback();
};

Imap.prototype.openBox = function(boxName, readOnly, callback) {
  this.boxName = boxName;
  callback(null, {name:boxName});
};

Imap.prototype.connect = function() {
  this.emit('ready');
  this.emit('mail', 1);
  return;
};

Imap.prototype.search = function(q, callback) {
  if (!(q instanceof Array)) throw new Error('q must be array');
  var type = q[0];
  var uidRange = q[1][1].split(':');
  var min = parseInt(uidRange[0]);
  var max = 1/0;
  if ( uidRange[1] && uidRange[1] !== '*') max = parseInt(uidRange[1]);
  fs.readdir(this.dataPath, function(err, items) {
    if (err) return callback(err);
    var itemNums = [];
    for (var i in items) {
      var num = parseInt(items[i]);
      if (num >= min && num <= max) itemNums.push(num);
    }
    return callback(null, itemNums.sort());
  })
};

Imap.prototype.fetch = function(q, fields) {
  var e = new EventEmitter();
  var dataPath = this.dataPath;
  async.forEachSeries(q, function(uid, cbEach) {
    fs.readFile(path.join(dataPath, '' + uid), function(err, data) {
      if (err) return e.emit('error', err);
      var attributes = JSON.parse(data.toString());
      var headers = attributes.headers;
      delete attributes.headers;
      var msg = new EventEmitter();
      var stream = new EventEmitter();
      e.emit('message', msg);
      msg.emit('body', stream);
      stream.emit('data', JSON.stringify(headers));
      stream.emit('end');
      msg.emit('attributes', attributes);
      msg.emit('end');
      cbEach();
    });
  }, function(err) {
    e.emit('end');
  });

  return e;
};

Imap.parseHeader = function(buffer) {
  return JSON.parse(buffer.toString());
};

Imap.prototype.addLabels = function(uid, labels, callback) {
  callback();
};

Imap.prototype.delLabels = function(uid, labels, callback) {
  callback();
};


module.exports = Imap;
