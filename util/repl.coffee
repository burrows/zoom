util = require 'util'
global.Z = require '../build/zoom'

inspect = util.inspect
util.inspect = (o) -> if o? and o.isZObject then o.toString() else inspect o
