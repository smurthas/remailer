var assert = require('assert');
var rules = require('rules');

describe('runTests()', function() {
  it('should throw an error for an invalid matcher', function() {
    var msg = {
      headers: {
        from: [
          'Simon Murtha Smith <blargh@gmail.com>'
        ]
      }
    };

    var test = {
      fields: 'headers.from',
      matcher: 'blargh',
      value: 'blargh@gmail.com'
    };

    // why doesn't assert.throws work in this scenario?
    try {
      rules.runTests(test, msg);
    } catch(err) {
      assert(err);
      return;
    }
    assert.fail('didn\'t throw an error');
  });

  it('should match partial matches of single value', function() {
    var msg = {
      headers: {
        from: [
          'Simon Murtha Smith <blargh@gmail.com>'
        ]
      }
    };

    var test = {
      fields: 'headers.from',
      matcher: 'partial',
      value: 'blargh@gmail.com'
    };

    assert(rules.runTests(test, msg));
  });

  it('should match partial matches of an array', function() {
    var msg = {
      headers: {
        from: [
          'Simon Murtha Smith <blargh@gmail.com>'
        ]
      }
    };

    var test = {
      fields: 'headers.from',
      matcher: 'partial',
      value: ['nomatch', 'blargh@gmail.com']
    };

    assert(rules.runTests(test, msg));
  });

  it('should match partial matches of comma delimited fields values', function() {
    var msg = {
      headers: {
        from: [
          'Simon Murtha Smith <blargh@gmail.com>'
        ]
      }
    };

    var test = {
      fields: 'recipients,headers.from',
      matcher: 'partial',
      value: 'blargh@gmail.com'
    };

    assert(rules.runTests(test, msg));
  });

  it('should match partial matches of recipients', function() {
    var msg = {
      headers: {
        bcc: [
          'Simon Murtha Smith <blargh@gmail.com>'
        ]
      }
    };

    var test = {
      fields: 'recipients',
      matcher: 'partial',
      value: 'blargh@gmail.com'
    };

    assert(rules.runTests(test, msg));
  });

  it('should match exact matches of single value', function() {
    var msg = {
      headers: {
        from: [
          'Simon Murtha Smith <blargh@gmail.com>'
        ]
      }
    };

    var test = {
      fields: 'headers.from',
      matcher: 'exact',
      value: 'Simon Murtha Smith <blargh@gmail.com>'
    };

    assert(rules.runTests(test, msg));
  });

  it('shouldn\'t match partial matches of single values', function() {
    var msg = {
      headers: {
        from: [
          'Simon Murtha Smith <blargh@gmail.com>'
        ]
      }
    };

    var test = {
      fields: 'headers.from',
      matcher: 'partial',
      value: 'someoneelse@gmail.com'
    };

    assert.strictEqual(rules.runTests(test, msg), false);
  });

  it('shouldn\'t match exact matches of single values', function() {
    var msg = {
      headers: {
        from: [
          'Simon Murtha Smith <blargh@gmail.com>'
        ]
      }
    };

    var test = {
      fields: 'headers.from',
      matcher: 'exact',
      value: 'gmail'
    };

    assert.strictEqual(rules.runTests(test, msg), false);
  });

  describe('subject', function() {
    it('should match on the subject field', function() {
      var msg = {
        headers: {
          subject: [
            'Your payment was processed for account ending in 12345'
          ]
        }
      };

      var test = {
        fields: 'headers.subject',
        matcher: 'partial',
        value: 'payment was processed'
      };

      assert.strictEqual(rules.runTests(test, msg), true);
    });
  });

  describe('$not', function() {
    it('should invert the truthiness of its child', function() {
      var msg = {
        headers: {
          from: [
            'Simon Murtha Smith <blargh@gmail.com>'
          ]
        }
      };

      var test = { $not: {
        fields: 'headers.from',
        matcher: 'exact',
        value: 'gmail'
      }};

      assert.strictEqual(rules.runTests(test, msg), true);
    });
  });

  describe('$and', function() {
    it('should match if all objects of a $and object match', function() {
      var msg = {
        headers: {
          from: [
            'Simon Murtha Smith <blargh@gmail.com>'
          ],
          to: [
            'someonelse@gmail.com'
          ]
        }
      };

      var test = {
        $and: [
          {
            fields: 'headers.from',
            matcher: 'partial',
            value: 'blargh@gmail.com'
          },
          {
            fields: 'headers.to',
            matcher: 'exact',
            value: 'someonelse@gmail.com'
          },
        ]
      };

      assert(rules.runTests(test, msg));
    });

    it('shouldn\'t match if not all objects of a $and object match', function() {
      var msg = {
        headers: {
          from: [
            'Simon Murtha Smith <blargh@gmail.com>'
          ],
          to: [
            'someonelse@gmail.com'
          ]
        }
      };

      var test = {
        $and: [
          {
            fields: 'headers.from',
            matcher: 'exact',
            value: 'blargh@gmail.com'
          },
          {
            fields: 'headers.to',
            matcher: 'exact',
            value: 'someonelse@gmail.com'
          },
        ]
      };

      assert.strictEqual(rules.runTests(test, msg), false);
    });
  });

  describe('$or', function() {
    it('should match if any of the objects match', function() {
      var msg = {
        headers: {
          from: [
            'Simon Murtha Smith <blargh@gmail.com>'
          ],
          to: [
            'someonelse@gmail.com'
          ]
        }
      };

      var test = {
        $or: [
          {
            fields: 'headers.from',
            matcher: 'partial',
            value: 'blargh@gmail.com'
          },
          {
            fields: 'headers.to',
            matcher: 'exact',
            value: 'nomatch@gmail.com'
          },
        ]
      };

      assert(rules.runTests(test, msg));
    });

    it('shouldn\'t match if none of the objects match', function() {
      var msg = {
        headers: {
          from: [
            'Simon Murtha Smith <blargh@gmail.com>'
          ],
          to: [
            'someonelse@gmail.com'
          ]
        }
      };

      var test = {
        $and: [
          {
            fields: 'headers.from',
            matcher: 'exact',
            value: 'blargh@gmail.com'
          },
          {
            fields: 'headers.to',
            matcher: 'exact',
            value: 'nomatch@gmail.com'
          },
        ]
      };

      assert.strictEqual(rules.runTests(test, msg), false);
    });
  });

  describe('gt', function() {
    it('should match if message value > test value', function() {
      var msg = {
        extracted: {
          amount: 9774
        }
      };

      var test = {
        fields: 'extracted.amount',
        matcher: 'gt',
        value: 8553
      };

      assert(rules.runTests(test, msg));
    });

  });

  describe('extractors', function() {
    it('should make a value available at msg.extracted.<key_name>', function() {
      var msg = {
        text: {
          plain: 'abcd,1254'
        }
      };

      var extractors = {
        myGreatKey: function(msg) {
          return msg.text.plain.slice(3,5);
        }
      };

      rules.runExtractors(extractors, msg);
      assert.strictEqual(msg.extracted.myGreatKey, 'd,');
    });
  });

});
