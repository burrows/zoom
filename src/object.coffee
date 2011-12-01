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
  #-----------------------------------------------------------------------------
  # Class
  #-----------------------------------------------------------------------------

  @addNamespace: (object, name) -> namespaces.push [object, name]

  @removeNamespace: (object) ->
    namespaces = _.reject namespaces, (namespace) -> namespace[0] == object

  @className: ->
    for namespace in namespaces
      for own k, v of namespace[0]
        if v == @
          return if namespace[1].length > 0 then "#{namespace[1]}.#{k}" else k

    '(Unknown)'

  @toString: @className

  @property: (name, opts = {}) ->
    opts = _.defaults opts, defaultPropertyOpts

    @["__property__#{name}__"] = opts

    @prototype[name] = (v) ->
      if typeof v == 'undefined'
        getProperty @, name
      else
        setProperty @, name, v

  @propertyDescriptors: ->
    props = {}

    for own k, v of @
      if match = k.match(/^__property__(\w+)__$/)
        props[match[1]] = v

    props

  @hasProperty: (k) -> typeof @["__property__#{k}__"] == 'object'

  #-----------------------------------------------------------------------------
  # Instance
  #-----------------------------------------------------------------------------

  constructor: -> @__objectId__ = objectId++

  isZObject: true

  objectId: -> @__objectId__

  toString: -> "#<#{@constructor.className()}:#{@objectId()}>"

  isEqual: (o) -> @ == o

  get: (paths...) ->
    paths = _.flatten paths

    if paths.length > 1
      return _.reduce(paths, ((acc, k) => acc[k] = @get(k); acc), {})

    [head, tail...] = paths[0].split '.'

    if tail.length > 0
      getProperty(@, head)?.get tail.join '.'
    else
      getProperty @, head

  set: (k, v) ->
    if arguments.length == 1
      hash = k
      @set k, v for own k, v of hash
    else
      setProperty @, k, v

    null

  getUnknownProperty: (k) ->
    throw new Error "Z.Object#get: undefined key `#{k}` for #{@toString()}"

  setUnknownProperty: (k, v) ->
    throw new Error "Z.Object#set: undefined key `#{k}` for #{@toString()}"

  #-----------------------------------------------------------------------------
  # Private
  #-----------------------------------------------------------------------------
  objectId = 1

  nextObjectId = -> objectId++

  namespaces = [ [Z, 'Z'], [Z.root, ''] ]

  defaultPropertyOpts =
    dependsOn: []
    cache: true
    auto: true
    get: null
    set: null

  getProperty = (o, k) ->
    prop = o.constructor["__property__#{k}__"]
    return o.getUnknownProperty(k) unless prop
    if prop.get then prop.get.call(o) else o["__#{k}__"]

  setProperty = (o, k, v) ->
    prop = o.constructor["__property__#{k}__"]
    return o.setUnknownProperty(k, v) unless prop

    if prop.set
      prop.set.call o, v
    else
      # willChange if prop.auto
      o["__#{k}__"] = v
      # didChange if prop.auto

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
