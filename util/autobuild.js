var watch = require('watch'), exec = require('child_process').exec;

function build(f, stat) {
  if (!f.match(/\.js$/)) { return; }
  exec('make zoom', function(error, stdout, stderr) { console.log(stdout); });
}

watch.createMonitor('./src', function(monitor) {
  monitor.on('created', build);
  monitor.on('changed', build);
  monitor.on('removed', build);
});
