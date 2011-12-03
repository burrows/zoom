if exports?
  Z = exports
  Z.platform = 'node'
  Z.root = global
else
  Z = window.Z = {}
  Z.platform = 'browser'
  Z.root = window

Z.defaults = (o, defaults...) ->
  for source in defaults
    o[k] ?= v for k, v of source
  o

Z.isNativeArray = Array.isArray or (o) ->
  !!(o and o.concat and o.unshift and not o.callee and not o.isZArray)

