var util = require('util'), inspect = util.inspect;

global.Z = require('../build/zoom');

util.inspect = function(o) {
  return Z.type(o) === 'zobject' ? o.toString() : inspect(o);
}

require('repl').start('zoom> ');

