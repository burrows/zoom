var util    = require('util'),
    inspect = util.inspect;

global.Z = require('../build/zoom');

util.inspect = function(o) {
  if (o && Z.isZObject(o)) {
    return o.toString();
  }
  else {
    return inspect(o);
  }
}

require('repl').start('zoom> ');
