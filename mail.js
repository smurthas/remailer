var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Imap = require('imap');

function MailListener(imapOptions, lastSeenUID) {
  this.imap = new Imap(imapOptions);
  this.lastSeenUID = lastSeenUID;
}

util.inherits(MailListener, EventEmitter);

MailListener.prototype.start = function() {
  var imap = this.imap;
  var self = this;

  imap.on('mail', function(id) {
    console.error('new mail?? count', id);
    self.getMessages();
  });

  imap.once('ready', function() {
    imap.getBoxes(function(err, boxes) {
      if (err) return self.emit('error', err);
      imap.openBox('[Gmail]/All Mail', false, function(err, box) {
        if (err) return self.emit('error', err);
        console.log('inbox open');
      });
    });
  });

  imap.connect();
}

MailListener.prototype.getMessages = function() {
  var self = this;
  var queryLastSeenUID = self.lastSeenUID;
  self.imap.openBox('[Gmail]/All Mail', false, function(err, box) {
    console.error('box', box);
    if (err) return self.emit('error', err);

    var q = (queryLastSeenUID + 1) + ':*';
    self.imap.search(['ALL', ['UID', q]], function(err, results) {
      if (err) return self.emit('error', err);

      console.error('results', results);

      var f = self.imap.fetch(results, {
        bodies: ['HEADER'],
        struct: true,
        envelope: true
      });
      f.on('message', function(msg, seqno) {
        console.log('Message #%d', seqno);
        var prefix = '(#' + seqno + ') ';
        var message = {};
        msg.on('body', function(stream, info) {
          var buffer = '';
          stream.on('data', function(chunk) {
            buffer += chunk.toString('utf8');
          });
          stream.once('end', function() {
            message.headers = Imap.parseHeader(buffer);
          });
        });
        msg.once('attributes', function(attrs) {
          message.attributes = attrs;
        });
        msg.once('end', function() {
          if (message.attributes.uid <= queryLastSeenUID) {
            return console.log('already seen it', message.attributes.uid);
          }
          var uid = parseInt(message.attributes.uid);
          if (uid > self.lastSeenUID) {
            self.lastSeenUID = uid;
          }
          self.emit('new_message', message);
          console.log(prefix + 'Finished');
        });
      });
      f.once('error', function(err) {
        console.log('Fetch error: ' + err);
      });
      f.once('end', function() {
        console.log('Done fetching all messages!');
      });
    });
  });
}

module.exports.MailListener = MailListener;
