var assert = require('assert');

var config = require('config');

describe('config', function() {
  describe('env', function() {
    it('should load env vars', function(done) {
      config.load(null, null, function() {
        assert(Object.keys(config).length > 2);
        done();
      });
    });
  });

  /*
  describe('etcd', function() {
    it('should callback with an error if etcd is not available', function(done) {
      try {
        config.load('etcd', '127.0.0.1', function(err) {
          assert(err);
          done();
        });
      } catch(err) {
        assert(err);
        done();
      }
    });
  });*/
});
