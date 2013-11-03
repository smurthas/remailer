var async = require('async');

var argv = require('optimist')
  .default('since-uid', process.env.UID || 1)
  .alias('uid', 'since-uid')
  .argv;

var MailListener = require('mail').MailListener;
var rules = require('rules');

var myRules = require('./myRules.js');


var mailListener = new MailListener({
  user: process.env.USER,
  password: process.env.PASS,
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


mailListener.start();
