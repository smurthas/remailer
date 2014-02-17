function loadEnv() {
  for(var i in process.env) module.exports[i] = process.env[i];
}

loadEnv();
