var _ = require('underscore');

function extractValue(field, object) {
  // we're done
  if (object === null || object === undefined) return object;

  // moving through the array, recursing
  if (field instanceof Array) {
    // shift the next key of the array and grab the next value
    var nextVal = object[field.shift()];
    // we still have more keys, recurse
    if (field.length > 0) {
      return extractValue(field, nextVal);
    }
    // no more keys, return
    return nextVal;
  }
  if (typeof field === 'string' && field.indexOf('.') !== -1) {
    // split on '.' and recurse
    return extractValue(field.split('.'), object);
  }
  return object[field];
}

function getMessageValues(fields, msg) {
  if (typeof fields === 'string' && fields.indexOf(',') !== -1) {
    return getMessageValues(fields.split(','), msg);
  }
  if (fields instanceof Array) {
    var ret = [];
    for (var i in fields) ret = ret.concat(getMessageValues(fields[i], msg));
    return ret;
  }
  if (fields === 'recipients' || fields === 'headers.recipients') {
    return getMessageValues(['headers.to', 'headers.cc', 'headers.bcc'], msg);
  }

  return extractValue(fields, msg);
}

module.exports.runTests = function(test, msg) {
  if (test.fields) {
    var msgValues = getMessageValues(test.fields, msg);
    return runTest(msgValues, test.value, test.matcher);
  }
  if (test.$and) {
    return _.every(test.$and, function(aTest) {
      return module.exports.runTests(aTest, msg);
    });
  }
  if (test.$or) {
    return _.any(test.$or, function(aTest) {
      return module.exports.runTests(aTest, msg);
    });
  }
  if (test.$not) {
    return !module.exports.runTests(test.$not, msg);
  }
};

function runTest(msgValues, testValues, matcher) {
  // string means we're at the inner most test value so we can actually compare
  // to the message values
  if (typeof testValues === 'string') {
    if (matcher === 'partial') {
      var any = _.any(msgValues, function(val) {
        return val && val.toLowerCase().indexOf(testValues) !== -1;
      });
      return any;
    }
    if (matcher === 'exact') {
      return _.contains(msgValues, testValues);
    }

    throw new Error('invalid matcher ' + matcher);
  }
  if (typeof testValues === 'number') {
    if (matcher === 'gt') return msgValues > testValues;
    if (matcher === 'gte') return msgValues >= testValues;
    if (matcher === 'lt') return msgValues < testValues;
    if (matcher === 'lte') return msgValues <= testValues;
    if (matcher === 'eq') return msgValues === testValues;
  }

  // we've got an array, so iterate over it, recursing with each
  return _.any(testValues, function(testValue) {
    return runTest(msgValues, testValue, matcher);
  });
}

module.exports.runExtractors = function(extractors, msg) {
  msg.extracted = {};
  for (var key in extractors) {
    msg.extracted[key] = extractors[key](msg);
  }
}
