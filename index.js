var fs = require('fs');
var url = require('url');

var async = require('async');
var request = require('request');

var MailListener = require('mail').MailListener;
var MailHandler = require('mailHandler').MailHandler;


function loadMyRules(rulesPath, callback) {
  var myRules;
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
    return setImmediate(callback.bind(this, null, myRules));
  }

  console.log('loading myRules from url', rulesPath);
  request.get(rulesPath, function(err, resp, body) {
    if (err) return callback(err);
    if (resp.statusCode !== 200) return callback(resp.statusCode);
    try {
      fs.writeFileSync('/tmp/myRules.js', body);
      myRules = require('/tmp/myRules.js');
    } catch(err) {
      return callback(err);
    }
    console.log('loaded myRules from url', rulesPath);
    return setImmediate(callback.bind(this, null, myRules));
  });
}


loadMyRules(process.env.IMAP_RULES, function(err, rules) {
  var mailListener = new MailListener({
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  }, process.env.IMAP_UID);
  var handler = new MailHandler(rules);
  mailListener.on('message', handler.handleMessage);
  mailListener.start();
});
