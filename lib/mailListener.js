var util = require('util');
var EventEmitter = require('events').EventEmitter;

var _ = require('underscore');
var Imap = require('imap');
//var Imap = require('fakeImap');

function MailListener(imapOptions, lastSeenUID) {
  this.imap = new Imap(imapOptions);
  this.lastSeenUID = lastSeenUID;
}

util.inherits(MailListener, EventEmitter);

MailListener.prototype.start = function() {
  var imap = this.imap;
  var self = this;

  imap.on('mail', function(id) {
    console.log('fetching new mail');
    self.getMessages();
  });

  imap.once('ready', function() {
    imap.getBoxes(function(err, boxes) {
      if (err) return self.emit('error', err);
      imap.openBox('[Gmail]/All Mail', false, function(err, box) {
        if (err) return self.emit('error', err);
        console.log('box open');
      });
    });
  });

  imap.connect();
}

MailListener.prototype.getMessages = function() {
  var self = this;
  var queryLastSeenUID = self.lastSeenUID;
  self.imap.openBox('[Gmail]/All Mail', false, function(err, box) {
    console.log('opened box', box.name);
    if (err) return self.emit('error', err);

    var q = (parseInt(queryLastSeenUID) + 1) + ':*';
    self.imap.search(['ALL', ['UID', q]], function(err, results) {
      if (err) return self.emit('error', err);

      console.error('got %d results', results.length);

      var f = self.imap.fetch(results, {
        bodies: ['HEADER'],
        struct: true,
        envelope: true
      });
      f.on('message', function(msg, seqno) {
        //console.log('Received message #%d', seqno);
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
          console.error('message', message.attributes.uid);
          self.emit('message',
            new Message(message.attributes, message.headers, self.imap));
          //console.log(prefix + 'Finished');
        });
      });
      f.once('error', function(err) {
        console.log('Fetch error: ' + err);
      });
      f.once('end', function() {
        console.log('Done fetching messages for now');
      });
    });
  });
}

function Message(attributes, headers, imapSource) {
  _.extend(this, attributes);
  this.headers = headers;
  this._imap = imapSource;
}

Message.prototype.addLabels = function(labels, callback) {
  this._imap.addLabels(this.uid, labels, callback);
};

Message.prototype.removeLabels = function(labels, callback) {
  this._imap.delLabels(this.uid, labels, callback);
};

module.exports.MailListener = MailListener;
