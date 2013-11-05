var assert = require('assert');
var rules = require('rules');

describe('runTests()', function() {
  it('should throw an error for an invalid matchType', function() {
    var msg = {
      headers: {
        from: [
          'Simon Murtha Smith <blargh@gmail.com>'
        ]
      }
    };

    var test = {
      fields: 'from',
      matchType: 'blargh',
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
      fields: 'from',
      matchType: 'partial',
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
      fields: 'from',
      matchType: 'partial',
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
      fields: 'recipients,from',
      matchType: 'partial',
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
      matchType: 'partial',
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
      fields: 'from',
      matchType: 'exact',
      value: 'Simon Murtha Smith <blargh@gmail.com>'
    };

    assert(rules.runTests(test, msg));
  });

  it('shouldn\'t match partial matches of single values', function() {
    var msg = {
      headers: {
        from: [
          'Simon Murtha Smith <smurthas@gmail.com>'
        ]
      }
    };

    var test = {
      fields: 'from',
      matchType: 'partial',
      value: 'someoneelse@gmail.com'
    };

    assert.strictEqual(rules.runTests(test, msg), false);
  });

  it('shouldn\'t match exact matches of single values', function() {
    var msg = {
      headers: {
        from: [
          'Simon Murtha Smith <smurthas@gmail.com>'
        ]
      }
    };

    var test = {
      fields: 'from',
      matchType: 'exact',
      value: 'gmail'
    };

    assert.strictEqual(rules.runTests(test, msg), false);
  });

  describe('$not', function() {
    it('should invert the truthiness of its child', function() {
      var msg = {
        headers: {
          from: [
            'Simon Murtha Smith <smurthas@gmail.com>'
          ]
        }
      };

      var test = { $not: {
        fields: 'from',
        matchType: 'exact',
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
            fields: 'from',
            matchType: 'partial',
            value: 'blargh@gmail.com'
          },
          {
            fields: 'to',
            matchType: 'exact',
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
            fields: 'from',
            matchType: 'exact',
            value: 'blargh@gmail.com'
          },
          {
            fields: 'to',
            matchType: 'exact',
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
            fields: 'from',
            matchType: 'partial',
            value: 'blargh@gmail.com'
          },
          {
            fields: 'to',
            matchType: 'exact',
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
            fields: 'from',
            matchType: 'exact',
            value: 'blargh@gmail.com'
          },
          {
            fields: 'to',
            matchType: 'exact',
            value: 'nomatch@gmail.com'
          },
        ]
      };

      assert.strictEqual(rules.runTests(test, msg), false);
    });
  });

});
