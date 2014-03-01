var queues = {};
var workersWaiting = {};

function ensureExists(name) {
  if (!queues[name]) queues[name] = [];
  if (!workersWaiting[name]) workersWaiting[name] = [];
}

function Queue(name) {
  ensureExists(name);
  this.queue = queues[name];
  this.workersWaiting = workersWaiting[name];
}


Queue.prototype.enqueue = function(item, callback) {
  if (this.workersWaiting.length > 0) {
    setImmediate(this.workersWaiting.shift().bind(this, null, item));
    return setImmediate(callback);
  }
  this.queue.push(item);
  return setImmediate(callback);
};

Queue.prototype.dequeue = function(callback) {
  if (this.queue.length) {
    return setImmediate(callback.bind(this, null, this.queue.shift()));
  }
  this.workersWaiting.push(callback);
};

Queue.prototype.length = function() {
  return this.queue.length;
};

module.exports = Queue;
