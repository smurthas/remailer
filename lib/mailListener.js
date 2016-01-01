var util = require('util');
var EventEmitter = require('events').EventEmitter;

var _ = require('underscore');
var Imap = require('imap');
//var Imap = require('fakeImap');

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

function MailListener(imapOptions, uidStore) {
  this.imap = new Imap(imapOptions);
  this.uidStore = uidStore;
}


util.inherits(MailListener, EventEmitter);

MailListener.prototype.start = function(noListener) {
  var imap = this.imap;
  var self = this;

  if (!noListener) {
    imap.on('mail', function() {
      console.log('fetching new mail');
      self.uidStore.getLatestUID(function(err, latestUID) {
        if (err) return self.emit('error', err);
        self.getMessages(latestUID + 1, '*');
      });
    });
  }

  imap.once('ready', function() {
    imap.getBoxes(function(err) {
      if (err) return self.emit('error', err);
      imap.openBox('[Gmail]/All Mail', false, function(err) {
        if (err) return self.emit('error', err);
        console.log('box open');
        self.emit('ready');
      });
    });
  });

  imap.connect();
};

MailListener.prototype.getMessages = function(lowUID, highUID) {
  var self = this;
  self.imap.openBox('[Gmail]/All Mail', false, function(err, box) {
    console.log('opened box', box.name);
    if (err) return self.emit('error', err);

    var q = lowUID + ':' + highUID;
    console.error('q', q);
    self.imap.search(['ALL', ['UID', q]], function(err, results) {
      if (err) return self.emit('error', err);

      console.error('got %d results %j', results.length, results);

      if (results.length === 0) {
        return self.emit('end');
      }

      var f = self.imap.fetch(results, {
        bodies: ['HEADER'],
        struct: true,
        envelope: true
      });
      f.on('message', function(msg) {
        //console.log('Received message #%d', seqno);
        var message = {};

        msg.on('body', function(stream) {
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
          if (message.attributes.uid < lowUID) {
            return console.log('already seen it', message.attributes.uid);
          }
          var uid = parseInt(message.attributes.uid);
          self.uidStore.setLatestUID(uid, function(err) {
            if (err) {
              console.error('got error back from setting latestUID', err);
              return self.emit('error', err);
            }

            console.error('message', message.attributes.uid);
            self.getMessageBody(uid, function(err, bodyParts) {
              self.emit('message', new Message(message.attributes,
                  message.headers, bodyParts, self.imap));
            });
          });
        });
      });

      f.once('error', function(err) {
        console.log('Fetch error: ' + err);
      });

      f.once('end', function() {
        console.log('Done fetching messages for now');
        self.emit('end');
      });
    });
  });
};

function cleanAlternative(struct, buffer) {
  if (!(struct[0] && struct[0].params)) {
    return {};
  }
  var boundary = struct[0].params.boundary;
  struct = struct.slice(1);
  if (!boundary) throw new Error('no boundary');
  var parts = buffer.split('--' + boundary);
  // split leaves an empty item at the beginning
  if (parts[0] === '' || parts[0] === '\r\n') parts.shift();
  // there's often some junk at the end, e.g. "--\r\n\r\n"
  if (parts[parts.length - 1].length < 7) parts.pop();

  var cleanParts = {};
  for (var i in struct) {
    var subtype = struct[i][0].subtype;
    cleanParts[subtype] = parts[i];
  }

  return cleanParts;
}

function cleanMultipart(struct, buffer) {
  // "multipart", but there's really just 2 parts that are burried.
  var boundary = struct[1][0].params.boundary;
  if (!boundary) throw new Error('no boundary');
  struct = struct[1].slice(1);
  var parts = buffer.split('--' + boundary);
  // Multipart messages have a preamble that is to be ignored.
  parts.shift();
  // Multipart messages have an epilog that is to be ignored.
  parts.pop();

  var cleanParts = {};
  for (var i in struct) {
    var subtype = struct[i][0].subtype;
    cleanParts[subtype] = parts[i];
  }

  return cleanParts;
}

MailListener.prototype.getMessageBody = function(uid, callback) {
  var self = this;
  var inspect = require('util').inspect;
  var f = self.imap.fetch([uid], {
      bodies: ['TEXT'],
      struct: true,
      envelope: true
    });

  f.on('message', function(msg) {
    var buffer = '';
    msg.on('body', function(stream, info) {
      var count = 0;
      stream.on('data', function(chunk) {
        count += chunk.length;
        buffer += chunk.toString('utf8');
      });
      stream.once('end', function() {
        console.log('Body [%s] Finished', inspect(info.which));
        //console.error('buffer', buffer);
      });
    });
    msg.once('attributes', function(attrs) {
      var struct = attrs.struct;
      var cleanParts = {};
      if (struct.length === 3) {
        //multipart
        if (struct[0].type === 'alternative') {
          return callback(null, cleanAlternative(struct, buffer));
        }
      } else if (struct.length === 1) {
        //single part
        cleanParts[struct[0].subtype] = buffer;
      } else if (struct.length === 2 && struct[1].length === 3 && struct[0].type === 'mixed') {
        return callback(null, cleanMultipart(struct, buffer));
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


module.exports = MailListener;
