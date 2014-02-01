var fs = require('fs');
var url = require('url');

var async = require('async');
var request = require('request');
var argv = require('optimist').argv;

var MailListener = require('mailListener');
var MailWorker = require('mailWorker');
var MemoryQueue = require('memoryQueue');
var UIDStore = require('UIDStore');
var config = require('config');

function start(user, pass, uidConfig, rulesPath) {
  // start listening for new messages
  var mailListener = new MailListener({
    user: user,
    password: pass,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  }, new UIDStore('etcd', uidConfig));

  var Q = new MemoryQueue(user);
  mailListener.on('message', function(msg) {
    Q.enqueue(msg, function(err) {
      if (err) console.error('enqueue error', err);
    });
  });
  mailListener.start();

  // start a worker to handle the messages
  var mailWorker = new MailWorker(Q, rulesPath);
  mailWorker.start();
}

if (!module.parent) {
  var etcdHost = argv['etcd-host'];
  config.load(etcdHost? 'etcd':null, etcdHost, function(err) {
    if (err) {
      console.error('error loading config', err);
      process.exit(2);
    }
    var user = config.IMAP_USER;
    var pass = config.IMAP_PASS;
    var uidConfig = etcdHost? {host: etcdHost} : config.IMAP_UID;
    var rules = config.IMAP_RULES;
    start(user, pass, uidConfig, rules);
  });
}
