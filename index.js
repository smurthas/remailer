var fs = require('fs');
var url = require('url');

var async = require('async');
var request = require('request');

var argv = require('optimist')
  .default('since-uid', process.env.IMAP_UID || 1)
  .alias('uid', 'since-uid')
  .argv;

var MailListener = require('mail').MailListener;
var rules = require('rules');

var myRules;

function loadMyRules(rulesPath, callback) {
  try {
    myRules = url.parse(rulesPath);
  } catch(err) {
    // load from file
    try {
      myRules = require(rulesPath);
    } catch(err) {
      return callback(err);
    }
    console.log('loaded myRules fs');
    return setImmediate(callback.bind(this, myRules));
  }

  request.get(rulesPath, function(err, resp, body) {
    if (err) return callback(err);
    if (resp.statusCode !== 200) return callback(resp.statusCode);
    try {
      fs.writeFileSync('/tmp/myRules.js', body);
      myRules = require('/tmp/myRules.js');
    } catch(err) {
      return callback(err);
    }
    console.log('loaded myRules url');
    return setImmediate(callback.bind(this, myRules));
  });
}


var mailListener = new MailListener({
  user: process.env.IMAP_USER,
  password: process.env.IMAP_PASS,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
}, argv.uid);


function runRules(msg, callback) {
  async.forEachSeries(myRules, function(rule, cbEach) {
    if (rules.runTests(rule.tests, msg)) {
      console.log('rule', rule.name, 'matched for', msg.uid);
      return async.forEachSeries(rule.actions, function(action, cbAction) {
        var key = Object.keys(action)[0];
        return msg[key](action[key], cbAction);
      }, cbEach);
    }
    console.log('rule', rule.name, 'didn\'t match for', msg.uid);
    setImmediate(cbEach);
  }, callback);
}

var Q = async.queue(function(msg, cbEach) {
  runRules(msg, function(err) {
    if (err) console.error('err', err);
    console.error('msg', msg.uid, 'done');
    setImmediate(cbEach);
  });
}, 1);
Q.drain = function() {
  console.log('drained!');
  //imap.end();
};


mailListener.on('message', function(msg) {
  Q.push(msg);
});

loadMyRules(process.env.IMAP_RULES, function(err, rules) {
  mailListener.start();
});
