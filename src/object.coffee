class Z.Object
  objectId = 1

  namespaces = [ [Z, 'Z'], [Z.root, ''] ]

  defaultPropertyOpts =
    dependsOn: []
    cache: true
    auto: true
    get: null
    set: null

  #-----------------------------------------------------------------------------
  # Class
  #-----------------------------------------------------------------------------

  @addNamespace: (object, name) -> namespaces.push [object, name]; null

  @removeNamespace: (object) ->
    namespaces = namespaces.filter (namespace) -> namespace[0] != object
    null

  @className: ->
    for namespace in namespaces
      for own k, v of namespace[0]
        if v == @
          return if namespace[1].length > 0 then "#{namespace[1]}.#{k}" else k

    '(Unknown)'

  @toString: @className

  @property: (name, opts = {}) ->
    opts = Z.defaults opts, defaultPropertyOpts

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

  @mixin: (mixin) ->
    for own k, v of mixin.class()
      @[k] = v

    for own k, v of mixin.instance()
      @prototype[k] = v

    for own k, v of mixin.property()
      @property k, v

  @mixin Z.Equatable

  #-----------------------------------------------------------------------------
  # Instance
  #-----------------------------------------------------------------------------

  constructor: (properties = {}) ->
    @__objectId__ = objectId++
    @set properties

  @property 'objectId', { readonly: true, get: -> @__objectId__ }

  isZObject: true

  toString: ->
    s     = "#<#{@constructor.className()}:#{@objectId()}"
    props = []

    for own name of @constructor.propertyDescriptors()
      props.push "@#{name}=#{@get name}" unless name == 'objectId'

    s += " #{props.join ', '}" if props.length > 0
    s += ">"

  eq: (o) -> @ == o

  get: () ->
    if arguments.length == 1
      if Z.isNativeArray arguments[0]
        paths = arguments[0]
      else if arguments[0]?.isZArray
        paths = arguments[0].toNative()
      else
        paths = [arguments[0]]
    else
      paths = Array.prototype.slice.call arguments

    if paths.length > 1
      result = {}
      result[path] = @_get(path.split '.') for path in paths
      result
    else
      @_get paths[0].split('.')

  _get: (path) ->
    [head, tail...] = path

    if tail.length > 0 then getProperty(@, head)?._get(tail)
    else getProperty @, head

  set: (path, value) ->
    if arguments.length == 1
      @set k, v for own k, v of path
      return null

    [init..., last] = path.split '.'

    if init.length > 0 then @_get(init)?.set last, value
    else setProperty @, path, value

    null

  getUnknownProperty: (k) ->
    throw new Error "#{@constructor.className()}#get: undefined key `#{k}` for #{@toString()}"

  setUnknownProperty: (k, v) ->
    throw new Error "#{@constructor.className()}#set: undefined key `#{k}` for #{@toString()}"

  #-----------------------------------------------------------------------------
  # Private Methods
  #-----------------------------------------------------------------------------

  nextObjectId = -> objectId++

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

