function loadEnv() {
  for(var i in process.env) {
    if (i === 'REDISCLOUD_URL') {
      module.exports.REDIS_URL = process.env[i];
      module.exports.UID_STORE = 'redis';
      continue;
    } else if (i === 'LATEST_UID') {
      module.exports.LATEST_UID = parseInt(process.env.LATEST_UID);
      module.exports.UID_STORE = 'mem';
      continue;
    }
    module.exports[i] = process.env[i];
  }
}

loadEnv();
