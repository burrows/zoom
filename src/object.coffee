root = this

Z = if exports? then exports else root.Z = {}

class Z.Object
  constructor: ->
    @__objectId__ = objectId++

  #-----------------------------------------------------------------------------
  # Class Methods
  #-----------------------------------------------------------------------------
  @addNamespace: (name, object) -> namespaces[name] = object; null

  @removeNamespace: (name) -> delete namespaces[name]; null

  @className: ->
    for name, namespace of namespaces
      for k, v of namespace
        return "#{name}.#{k}" if v == @

    '(Unknown)'

  @toString: @className

  #-----------------------------------------------------------------------------
  # Prototype Properties
  #-----------------------------------------------------------------------------
  isZObject: true

  #-----------------------------------------------------------------------------
  # Instance Methods
  #-----------------------------------------------------------------------------

  objectId: -> @__objectId__

  toString: -> "#<#{@constructor.className()}:#{@objectId()}>"

  #-----------------------------------------------------------------------------
  # Private
  #-----------------------------------------------------------------------------
  objectId = 1
  nextObjectId = -> objectId++

  namespaces = { Z: Z }

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

  #set: (k, v) ->
  #  setter = 'set' + k[0].toUpperCase() + k.slice(1)
  #  method = @[setter]

  #  if typeof method == 'function'
  #    method.call @, v
  #  else
  #    # call setValueForUndefinedKey

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
