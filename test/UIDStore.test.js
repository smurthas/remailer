var assert = require('assert');

var UIDStore = require('UIDStore');
var Etcd = new require('node-etcd');
var etcd = new Etcd('172.17.42.1');

function createSetAndGetTest(store) {
  return function(done) {
    store.setLatestUID(10, function(err) {
      assert(!err);
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
  }
}

function createNotLowerTest(store) {
  return function(done) {
    store.setLatestUID(85, function(err) {
      assert(!err);
      store.setLatestUID(5, function(err) {
        assert(!err);
        store.getLatestUID(function(err, uid) {
          assert(!err);
          assert.equal(uid, 85);
          done();
        });
      });
    });
  }
}

describe('UIDStore', function() {
  describe('MemoryUIDStore', function() {
    var store = new UIDStore('mem', 10);

    it('should be able to set and get UIDs', createSetAndGetTest(store));

    it('should not set a UID that is lower than the one it has',
      createNotLowerTest(store));
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

  describe('etcdUIDStore', function() {
    var store = new UIDStore('etcd', {
      host: '172.17.42.1'
    });

    beforeEach(function(done) {
      etcd.del(store.impl.path, done);
    });

    it('should be able to set and get UIDs', createSetAndGetTest(store));

    it('should not set a UID that is lower than the one it has',
      createNotLowerTest(store));
  });
});
