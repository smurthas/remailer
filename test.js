setInterval(function() {
  console.log('yep', Date.now());
  console.error('process.env', process.env);
}, 1000);
