var util = require('util');

global.Z = require('../build/zoom');

util.inspect = Z.inspect;

require('repl').start('zoom> ', undefined, undefined, true, false);

