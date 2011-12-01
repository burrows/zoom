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

  constructor: (properties = {}) ->
    @__objectId__ = objectId++
    @set properties

  isZObject: true

  objectId: -> @__objectId__

  toString: ->
    s = "#<#{@constructor.className()}:#{@objectId()}"
    props = for own name of @constructor.propertyDescriptors()
      "@#{name}=#{@get name}"
    s += " #{props.join ','}" if props.length > 0
    s += ">"

  isEqual: (o) -> @ == o

  get: (paths...) ->
    paths = _.flatten paths

    if paths.length > 1
      return _.reduce(paths, ((acc, k) => acc[k] = @get(k); acc), {})

    [head, tail...] = paths[0].split '.'

    if tail.length > 0 then getProperty(@, head)?.get(tail.join '.')
    else getProperty @, head

  set: (path, value) ->
    if arguments.length == 1
      @set k, v for own k, v of path
      return null

    [init..., last] = path.split '.'

    if init.length > 0 then @get(init.join '.')?.set last, value
    else setProperty @, path, value

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

