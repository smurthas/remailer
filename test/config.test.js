var assert = require('assert');

var config = require('config');

describe('config', function() {
  describe('env', function() {
    it('should load env vars', function() {
      config.load(null, null, function() {
        console.error('config', config);
        assert(Object.keys(config).length > 2);
      });
    });
  });
});
