var util = require('util'), domino = require('domino');

global.window   = domino.createWindow();
global.document = window.document;

global.Z = require('../build/zoom');

util.inspect = Z.inspect;

require('repl').start({prompt: 'zoom> ', terminal: false});

