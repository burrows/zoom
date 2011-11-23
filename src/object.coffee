if exports?
  Z = exports
  Z.platform = 'node'
  Z.root = global
else
  Z = window.Z = {}
  Z.platform = 'browser'
  Z.root = window

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
        if v == @
          return if name.length > 0 then "#{name}.#{k}" else k

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

  get: (k) ->
    prop = @[k]
    type = typeof prop

    return @unknownProperty(k) if type == 'undefined'

    if type == 'function'
      prop()
    else
      @[k]

  set: (k, v) ->
    prop = @[k]

    return @unknownProperty(k, v) if typeof prop == 'undefined'

    if typeof prop == 'function'
      prop(v)
    else
      @[k] = v

    null

  unknownProperty: (k, v) ->
    m = if typeof v == 'undefined' then 'get' else 'set'
    throw new Error "Z.Object##{m}: undefined key `#{k}` for #{@toString()}"

  #-----------------------------------------------------------------------------
  # Private
  #-----------------------------------------------------------------------------
  objectId = 1
  nextObjectId = -> objectId++

  namespaces = { Z: Z, '': Z.root }

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
