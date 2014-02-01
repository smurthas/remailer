var assert = require('assert');

var MailHandler = require('mailHandler').MailHandler;

var rules = [
  {
    tests: {
      fields: ['to'],
      value: 'hello',
      matcher: 'exact'
    }
  }
];

var mh = new MailHandler(rules);

describe('handleMessage', function() {
  it('should run without error', function(done) {
    mh.handleMessage({uid:1}, function(err) {
      if (err) throw err;
      done();
    });
  });

  it('should run without error', function(done) {
    var msg = {uid:1, to:'hello'};
    var calledFunction = false;
    rules[0].actions = [
      function(msg1, cb) {
        console.log('hell');
        assert.equal(msg1.to, msg.to);
        calledFunction = true;
        cb();
      }
    ];
    console.log('go');
    mh.handleMessage(msg, function(err) {
      if (err) throw err;
      assert(calledFunction);
      console.log('done');
      done();
    });
  });
});
