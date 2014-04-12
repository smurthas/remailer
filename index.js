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
  }, new UIDStore('redis', uidConfig));

  var Q = new MemoryQueue(user);
  mailListener.on('message', function (msg) {
    Q.enqueue(msg, function (err) {
      if (err) console.error('enqueue error', err);
    });
  });
  mailListener.start();

  // start a worker to handle the messages
  var mailWorker = new MailWorker(Q, rulesPath);
  mailWorker.start();
}

if (!module.parent) {
  console.error('config', config);
  var user = config.IMAP_USER;
  var pass = config.IMAP_PASS;
  var rules = config.IMAP_RULES;
  var uidConfig = { url: config.REDISCLOUD_URL };

  // this is for etcd
  //var uidConfig = { host: argv['etcd-host']};
  start(user, pass, uidConfig, rules);
}
