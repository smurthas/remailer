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

function start(user, pass, lastUID, rulesPath) {
  // start listening for new messages
  var mailListener = new MailListener({
    user: user,
    password: pass,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  }, new UIDStore('mem', lastUID));

  var Q = new MemoryQueue(config.queueName);
  mailListener.on('message', function(msg) {
    Q.enqueue(msg, function(err) {
      if (err) console.error('enqueue error', err);
    });
  });
  mailListener.start();

  // start a worker to handle the messages
  var mailWorker = new MailWorker(user, rulesPath);
  mailWorker.start();
}

if (!module.parent) {
  var etcdHost = argv['etcd-host'];
  config.load(etcdHost? 'etcd':null, etcdHost, function(err) {
    if (err) {
      console.error('error loading config', err);
      process.exit(2);
    }
    start(config.IMAP_USER, config.IMAP_PASS,
      config.IMAP_UID, config.IMAP_RULES);
  });
}
