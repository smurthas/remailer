var assert = require('assert');
var rules = require('../rules');

describe('runTests()', function() {
  it('should throw an error for an invalid matchType', function() {
    var msg = {
      headers: {
        from: [
          'Simon Murtha Smith <smurthas@gmail.com>'
        ]
      }
    };

    var test = {
      fields: 'from',
      matchType: 'blargh',
      value: 'smurthas@gmail.com'
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
          'Simon Murtha Smith <smurthas@gmail.com>'
        ]
      }
    };

    var test = {
      fields: 'from',
      matchType: 'partial',
      value: 'smurthas@gmail.com'
    };

    assert(rules.runTests(test, msg));
  });

  it('should match partial matches of an array', function() {
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
      value: ['nomatch', 'smurthas@gmail.com']
    };

    assert(rules.runTests(test, msg));
  });

  it('should match partial matches of comma delimited fields values', function() {
    var msg = {
      headers: {
        from: [
          'Simon Murtha Smith <smurthas@gmail.com>'
        ]
      }
    };

    var test = {
      fields: 'recipients,from',
      matchType: 'partial',
      value: 'smurthas@gmail.com'
    };

    assert(rules.runTests(test, msg));
  });

  it('should match partial matches of recipients', function() {
    var msg = {
      headers: {
        bcc: [
          'Simon Murtha Smith <smurthas@gmail.com>'
        ]
      }
    };

    var test = {
      fields: 'recipients',
      matchType: 'partial',
      value: 'smurthas@gmail.com'
    };

    assert(rules.runTests(test, msg));
  });

  it('should match exact matches of single value', function() {
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
      value: 'Simon Murtha Smith <smurthas@gmail.com>'
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

    assert(!rules.runTests(test, msg));
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

    assert(!rules.runTests(test, msg));
  });

});
