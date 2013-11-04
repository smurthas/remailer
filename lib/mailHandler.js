var async = require('async');
var rules = require('rules');

function MailHandler(myRules) {
  this.rules = myRules;
  var Q = async.queue(this.processMessage.bind(this), 1);
  this.handleMessage = Q.push;
}

MailHandler.prototype.processMessage = function(msg, callback) {
  console.log('processing', msg.uid);
  var myRules = this.rules;
  async.forEachSeries(myRules, function(rule, cbEach) {
    if (rules.runTests(rule.tests, msg)) {
      console.log('rule', rule.name, 'matched for', msg.uid);
      return async.forEachSeries(rule.actions, function(action, cbAction) {
        var key = Object.keys(action)[0];
        // the msg object must have a function name matching the action name
        return msg[key](action[key], cbAction);
      }, cbEach);
    }
    setImmediate(cbEach);
  }, function(err) {
    if (err) console.error('error processing message %d', msg.uid, err);
    else console.log('finished processing message %d', msg.uid);
    return callback(err);
  });
}

module.exports.MailHandler = MailHandler;
