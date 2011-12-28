var util    = require('util'),
    inspect = util.inspect;

global.Z = require('../build/zoom');

util.inspect = function(o) {
  if (o && o.isZObject) {
    return o.toString();
  }
  else {
    return inspect(o);
  }
}

require('repl').start('zoom> ');
