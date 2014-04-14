//var _ = require('underscore');
var async = require('async');
var rules = require('rules');

function MailHandler(myRules) {
  this.rules = myRules;
  var Q = async.queue(this.processMessage.bind(this), 1);
  this.handleMessage = Q.push;
}

MailHandler.prototype.processMessage = function(msg, callback) {
  console.log('processing', msg.uid, msg.headers && msg.headers.subject);
/*  var dataCachePath = path.join('/data', 'imap', process.env.IMAP_USER, '' + msg.uid);
  return fs.writeFile(dataCachePath, JSON.stringify(_.omit(msg, '_imap')),
    function(err) {
    if (err) console.error('err', err);
    callback(err);
  });
  throw new Error('wtf?');*/

  var myRules = this.rules;
  async.forEachSeries(myRules, function(rule, cbEach) {
    // run extractors will modify the msg object by adding new a new key
    // 'extracted' with subvalues for each extractor
    if (rule.extractors) rules.runExtractors(rule.extractors, msg);
    //console.error('msg', _.omit(msg, '_imap', 'text'));

    // runTests will return true if the tests for this rule pass. Note the
    // extracted values will be passed in as part of msg
    if (rules.runTests(rule.tests, msg)) {
      console.log('rule', rule.name, 'matched for', msg.uid);
      return async.forEachSeries(rule.actions, function(action, cbAction) {
        // if it's a function, call it directly
        if (typeof action === 'function') return action(msg, cbAction);

        // otherwise it's a Message class function. Call that (by name) and
        // pass in the value from the action
        var key = Object.keys(action)[0];
        // the msg object must have a function name matching the action name
        console.log('performing action %s with value %s', key, action[key]);
        return msg[key](action[key], cbAction);
      }, cbEach);
    }
    setImmediate(cbEach);
  }, function(err) {
    if (err) console.error('error processing message %d', msg.uid, err);
    else console.log('finished processing message %d', msg.uid);
    return callback(err);
  });
};

module.exports.MailHandler = MailHandler;
