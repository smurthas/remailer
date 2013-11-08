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

    var q = queryLastSeenUID;
    if (q.indexOf(':') === -1) {
      var sinceUID = parseInt(queryLastSeenUID) + 1;
      q = sinceUID + ':*';
    }
    self.imap.search(['ALL', ['UID', q]], function(err, results) {
      if (err) return self.emit('error', err);

      console.error('got %d results %j', results.length, results);

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
          self.getMessageBody(uid, function(err, bodyParts) {
            self.emit('message', new Message(message.attributes,
                message.headers, bodyParts, self.imap));
          });
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

MailListener.prototype.getMessageBody = function(uid, callback) {
  var self = this;
  var inspect = require('util').inspect;
  var f = self.imap.fetch([uid], {
      bodies: ['TEXT'],
      struct: true,
      envelope: true
    });

  f.on('message', function(msg, seqno) {
    var buffer = '';
    msg.on('body', function(stream, info) {
      var count = 0;
      stream.on('data', function(chunk) {
        count += chunk.length;
        buffer += chunk.toString('utf8');
      });
      stream.once('end', function() {
        console.log('Body [%s] Finished', inspect(info.which));
      });
    });
    msg.once('attributes', function(attrs) {
      var struct = attrs.struct;
      var cleanParts = {};
      if (struct.length === 3) {
        //multipart
        if (struct[0].type === 'alternative') {
          var boundary = struct[0].params.boundary;
          struct = struct.slice(1);
          if (!boundary) throw new Error('no boundary');
          var parts = buffer.split('--' + boundary);
          // split leaves an empty item at the beginning
          if (parts[0] === '' || parts[0] === '\r\n') parts.shift();
          // there's often some junk at the end, e.g. "--\r\n\r\n"
          if (parts[parts.length - 1].length < 7) parts.pop();
          for (var i in struct) {
            var subtype = struct[i][0].subtype;
            cleanParts[subtype] = parts[i];
          }
        }
      } else if (struct.length === 1) {
        //single part
        cleanParts[struct[0].subtype] = buffer;
      } else {
        console.error('unknown parts number', JSON.stringify(struct, true, 2));
        return callback();
      }

      // ok we're done
      /*if (buffer.length < 10000) {
        console.error('cleanParts', cleanParts);
      }*/

      return callback(null, cleanParts);
    });
    msg.on('end', function() {

    });
  });
  f.once('error', function(err) {
    console.log('Fetch error: ' + err);
  });
  f.once('end', function() {
    console.log('Done fetching all messages!');
    //self.imap.end();
  });
};

function Message(attributes, headers, text, imapSource) {
  _.extend(this, attributes);
  this.headers = headers;
  this.text = text;
  this._imap = imapSource;
}

Message.prototype.addLabels = function(labels, callback) {
  this._imap.addLabels(this.uid, labels, callback);
};

Message.prototype.removeLabels = function(labels, callback) {
  this._imap.delLabels(this.uid, labels, callback);
};

module.exports.MailListener = MailListener;
