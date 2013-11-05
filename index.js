var fs = require('fs');
var url = require('url');

var async = require('async');
var request = require('request');

var MailListener = require('mailListener').MailListener;
var MailWorker = require('MailWorker');
var MemoryQueue = require('memoryQueue');
var QUEUE_NAME = process.env.IMAP_USER;

function start(user, pass, lastUID, rulesPath) {
  // start listening for new messages
  var mailListener = new MailListener({
    user: user,
    password: pass,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  }, lastUID);

  var Q = new MemoryQueue(QUEUE_NAME);
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

start(process.env.IMAP_USER, process.env.IMAP_PASS,
      process.env.IMAP_UID, process.env.IMAP_RULES);
