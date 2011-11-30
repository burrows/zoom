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

class Z.Object
  constructor: ->
    @__objectId__ = objectId++

  #-----------------------------------------------------------------------------
  # Class Methods
  #-----------------------------------------------------------------------------
  @addNamespace: (object, name) -> namespaces.push [object, name]

  @removeNamespace: (object) ->
    namespaces = _.reject namespaces, (namespace) -> namespace[0] == objec

  @className: ->
    for namespace in namespaces
      for own k, v of namespace[0]
        if v == @
          return if namespace[1].length > 0 then "#{namespace[1]}.#{k}" else k

    '(Unknown)'

  @toString: @className

  @property: (name) ->
    @prototype[name] = (v) ->
      if typeof v == 'undefined'
        getProperty @, name
      else
        setProperty @, name, v

  #-----------------------------------------------------------------------------
  # Prototype Properties
  #-----------------------------------------------------------------------------
  isZObject: true

  #-----------------------------------------------------------------------------
  # Instance Methods
  #-----------------------------------------------------------------------------

  objectId: -> @__objectId__

  toString: -> "#<#{@constructor.className()}:#{@objectId()}>"

  isEqual: (o) -> @ == o

  get: (keys...) ->
    keys = _.flatten keys

    if keys.length > 1
      _.reduce(keys, ((acc, k) => acc[k] = @get(k); acc), {})
    else
      k = keys[0]

      return @unknownProperty(k) unless typeof @[k] == 'function'

      @[k]()

  set: (k, v) ->
    if arguments.length == 1
      hash = k

      @set k, v for own k, v of hash
    else
      return @unknownProperty(k, v) unless typeof @[k] == 'function'

      @[k](v)

    null

  unknownProperty: (k, v) ->
    m = if typeof v == 'undefined' then 'get' else 'set'
    throw new Error "Z.Object##{m}: undefined key `#{k}` for #{@toString()}"

  #-----------------------------------------------------------------------------
  # Private
  #-----------------------------------------------------------------------------
  objectId = 1

  nextObjectId = -> objectId++

  namespaces = [ [Z, 'Z'], [Z.root, ''] ]

  getProperty = (o, k) -> o["__#{k}__"]

  setProperty = (o, k, v) -> o["__#{k}__"] = v

  #@property: (name) ->
  #  getter = name
  #  setter = 'set' + name[0].toUpperCase() + name.slice(1)
  #  prop   = '__' + name + '__'
  #  @prototype[getter] = -> @[prop]
  #  @prototype[setter] = (v) -> @[prop] = v

  #get: (k) ->
  #  method = @[k]

  #  if typeof method == 'function'
  #    method.call @
  #  else
  #    # call valueForUndefinedKey


  #getPath: (path) ->
  #  [head, tail...] = path.split '.'
  #  object          = @get head

  #  return null unless object?

  #  for part in tail
  #    object = object.get part
  #    return null unless object?

  #  object

  #setPath: (path, v) ->
  #  [init..., last] = path.split '.'
  #  object          = @getPath init.join('.')

  #  if object
  #    object.set last, v
  #  else
  #    # throw something
