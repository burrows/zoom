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

# Copies all of the properties in the source objects over to the destination
# object. The sources are processed in order, so subsequent sources will
# override properties of the same name in previous sources.
#
# * `o`       - The destination object.
# * `sources` - One ore more source objects.
#
# Returns `o`.
Z.merge = (o, sources...) ->
  for source in sources
    o[k] = v for k, v of source
  o

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

# Performs an object equality test. If the first argument is an instance of
# `Z.Object` then it is sent the `eq` method, otherwise a deep object comparison
# is performed.
#
# FIXME: do a deep object comparison when given native objects
#
# a - Any object.
# b - Any object.
#
# Returns `true` if the objects are equal and `false` otherwise.
Z.eq = (a, b) ->
  return a.eq b if a and a.isZObject
  a == b

