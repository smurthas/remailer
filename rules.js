

module.exports.from = function(msg, from) {
  if (typeof from === 'string') return isFromString(msg, from);

  for (var i in from) if (module.exports.from(msg, from[i])) return true;
  return false;
}

function isFromString(msg, from) {
  var msgFrom = msg.headers && msg.headers.from;
  if (!msgFrom) return false;

  for (var i in msgFrom) {
    var testFrom = msgFrom[i];
    if (testFrom.indexOf(from) !== -1) return true;
  }

  return false;
}
