var _ = require('underscore');

function getMessageValues(fields, msg) {
  if (typeof fields === 'string' && fields.indexOf(',') !== -1) {
    return getMessageValues(fields.split(','), msg);
  }
  if (fields instanceof Array) {
    var ret = [];
    for (var i in fields) ret = ret.concat(getMessageValues(fields[i], msg));
    return ret;
  }
  if (fields === 'recipients') {
    return getMessageValues(['to', 'cc', 'bcc'], msg);
  }
  return msg.headers[fields];
}

module.exports.runTests = function(test, msg) {
  if (test.fields) {
    var msgValues = getMessageValues(test.fields, msg);
    return runTest(msgValues, test.value, test.matchType);
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

function runTest(msgValues, testValues, matchType) {
  // string means we're at the inner most test value so we can actually compare
  // to the message values
  if (typeof testValues === 'string') {
    if (matchType === 'partial') {
      var any = _.any(msgValues, function(val) {
        return val && val.indexOf(testValues) !== -1;
      });
      return any;
    }
    if (matchType === 'exact') {
      return _.contains(msgValues, testValues);
    }

    throw new Error('invalid matchType ' + matchType);
  }

  // we've got an array, so iterate over it, recursing with each
  return _.any(testValues, function(testValue) {
    return runTest(msgValues, testValue, matchType);
  });
}
