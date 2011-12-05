# **Zoom**

# Set up some top-level environment vars.
if exports?
  Z = exports
  Z.platform = 'node'
  Z.root = global
else
  Z = window.Z = {}
  Z.platform = 'browser'
  Z.root = window

# Takes a native javascript object and merges in properties from a list of
# default objects if they are not already present in the first object.
#
# * `o`           - The object to merge default values into
# * `defaults...` - One or more objects that contain default values.
#
# Returns `o`.
Z.defaults = (o, defaults...) ->
  for source in defaults
    o[k] ?= v for k, v of source
  o

# Returns whether the given object is a native javascript array. Uses
# `Array.isArray` if it is available.
#
# * `o` - The object to check.
#
# Returns `true` if the object is a native array and `false` otherwise.
Z.isNativeArray = Array.isArray or (o) ->
  !!(o and o.concat and o.unshift and not o.callee and not o.isZArray)

# Converts the given object to a string.
#
# FIXME: handle native objects
#
# * `o` - The object to convert to a string.
#
# Returns a string representation of the given object.
Z.toString = (o) -> o?.toString() || String o

