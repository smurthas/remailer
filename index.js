var argv = require('optimist').argv;
var _ = require('underscore');

var MailListener = require('mailListener');
var MailWorker = require('mailWorker');
var MemoryQueue = require('memoryQueue');
var UIDStore = require('UIDStore');
var config = require('config');

function setup(user, pass, uidConfig, rulesPath) {
  // start listening for new messages
  var mailListener = new MailListener({
    user: user,
    password: pass,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  }, new UIDStore(config.UID_STORE, uidConfig));

  var Q = new MemoryQueue(user);
  mailListener.on('message', function (msg) {
    Q.enqueue(msg, function (err) {
      if (err) console.error('enqueue error', err);
    });
  });

  // start a worker to handle the messages
  var mailWorker = new MailWorker(Q, rulesPath);
  mailWorker.start();

  return mailListener;
}

function setUID(storeConfig, newUid, callback) {
  var store = new UIDStore(config.UID_STORE, storeConfig);
  function set() {
    console.log('Setting new UID to:', newUid);
    store.setLatestUID(newUid, callback);
  }
  store.getLatestUID(function(err, oldUID) {
    oldUID = parseInt(oldUID);
    console.log('old UID was:', oldUID);
    newUid = parseInt(newUid);
    var diff = Math.abs(newUid - oldUID);
    if (diff > 100) {
      console.log('New UID is significatnly different than old UID. Waiting 10 seconds and then setting new UID to:', newUid);
      return setTimeout(set, 10 * 1000);
    }
  });
  store.setLatestUID(newUid, callback);
}

if (!module.parent) {
  console.error('config', _.omit(config, 'IMAP_PASS'));
  var user = config.IMAP_USER;
  var pass = config.IMAP_PASS;
  var rules = config.IMAP_RULES;
  var uidConfig = { url: config.REDIS_URL };

  if (argv['set-uid']) {
    return setUID(uidConfig, argv['set-uid'], process.exit);
  }

  // this is for etcd
  //var uidConfig = { host: argv['etcd-host']};
  var ml = setup(user, pass, uidConfig, rules);
  if (argv.uid) {
    ml.once('ready', function() {
      ml.getMessages(config.LATEST_UID, config.LATEST_UID);
    });
    ml.start(true);
  } else {
    ml.start();
  }
}
