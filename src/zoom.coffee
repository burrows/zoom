if exports?
  Z = exports
  Z.platform = 'node'
  Z.root = global
  _ = require 'underscore'
else
  Z = window.Z = {}
  Z.platform = 'browser'
  Z.root = window
  _ = window._

Z.defaults = (o, defaults...) ->
  for source in defaults
    o[k] ?= v for k, v of source
  o

Z.isArray = Array.isArray or (o) ->
  !!(o and o.concat and o.unshift and not o.callee and not o.isZArray)

