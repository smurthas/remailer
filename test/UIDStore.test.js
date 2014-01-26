var assert = require('assert');

var UIDStore = require('UIDStore');

describe('UIDStore', function() {
  describe('MemoryUIDStore', function() {
    var store = new UIDStore('mem', 10);

    it('should be able to set and get UIDs', function(done) {
      store.getLatestUID(function(err, uid) {
        assert(!err);
        assert.equal(uid, 10);
        store.setLatestUID(85, function(err) {
          assert(!err);
          store.getLatestUID(function(err, uid) {
            assert(!err);
            assert.equal(uid, 85);
            done();
          });
        });
      });
    });

    it('should not set a UID that is lower than the one it has', function(done) {
      store.setLatestUID(5, function(err) {
        assert(!err);
        store.getLatestUID(function(err, uid) {
          assert(!err);
          assert.notEqual(uid, 5);
          done();
        });
      });
    });
  });

  describe('s3UIDStore', function() {
    it('can create an s3 store', function() {
      var store = new UIDStore('s3', {s3:{
        key:'nope',
        secret:'npe',
        bucket: 'nah'
      }});
    });
  });
});
