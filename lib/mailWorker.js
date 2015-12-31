var fs = require('fs');
var url = require('url');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var request = require('request');
var async = require('async');

var MailHandler = require('mailHandler').MailHandler;


function loadRules(rulesPath, callback) {
  console.error('rulesPath', rulesPath);
  var myRules;

  if (rulesPath.indexOf('http') !== 0) {
    // load from file
    try {
      myRules = require(rulesPath);
      console.error('myRules', myRules);
    } catch(err) {
      return callback(err);
    }
    console.log('loaded myRules fs');
    return setImmediate(callback.bind(this, null, myRules));
  }

  try {
    myRules = url.parse(rulesPath);
  } catch(err) {
    return callback(err);
  }

  console.log('loading myRules from url', rulesPath);
  request.get(rulesPath, function(err, resp, body) {
    if (err) return callback(err);
    if (resp.statusCode !== 200) return callback(resp.statusCode);
    try {
      fs.writeFileSync('./myRules.js', body);
      myRules = require('./myRules.js');
    } catch(err) {
      return callback(err);
    }
    console.log('loaded myRules from url', rulesPath);
    return setImmediate(callback.bind(this, null, myRules));
  });
}

function MailWorker(Q, rulesPath) {
  this.rulesPath = rulesPath;
  this.Q = Q;
}

util.inherits(MailWorker, EventEmitter);

MailWorker.prototype.start = function() {
  var Q = this.Q;
  var self = this;
  console.error('this.rulesPath', this.rulesPath);
  loadRules(this.rulesPath, function(err, rules) {
    if (err) return self.emit('error', err);
    console.error('rules', rules);
    var handler = new MailHandler(rules);
    async.forever(function(cb) {
      Q.dequeue(function(err, msg) {
        if (err) return cb(err);
        handler.processMessage(msg, cb);
      });
    }, function(err) {
      throw err;
    });
  });
};

module.exports = MailWorker;
