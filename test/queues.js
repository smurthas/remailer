var assert = require('assert');

var MemoryQueue = require('memoryQueue');


describe('memoryQueue', function() {
  describe('enqueue and dequeue', function() {
    var ITEM = {
      hello: 'world!'
    };
    it('should queue items until a worker dequeues them', function(done) {
      var Q = new MemoryQueue('' + Math.random());
      Q.enqueue(ITEM, function(err) {
        assert(!err);
        assert.equal(Q.length(), 1);
        Q.dequeue(function(err, item) {
          assert.deepEqual(ITEM, item);
          done();
        });
      });
    });

    it('should block a worker callback until there is an item in the queue',
      function(done) {
      var Q = new MemoryQueue('' + Math.random());
      Q.dequeue(function(err, item) {
        assert.deepEqual(ITEM, item);
        done();
      });
      setImmediate(function() {
        Q.enqueue(ITEM, function(err) {
          assert(!err);
          assert.equal(Q.length(), 0);
        });
      });
    });
  });
})
