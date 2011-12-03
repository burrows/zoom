class Z.Array extends Z.Object
  NativeArray = Z.root.Array

  @mixin Z.Equatable
  @mixin Z.Enumerable

  # FIXME: make sure these properties are notified of changes where appropriate
  @property 'length',
    get: -> @__array__.length
    set: (v) -> @__array__.length = v

  @property 'first',
    get: -> @at 0
    set: (v) -> @at 0, v

  @property 'last',
    get: -> @at -1
    set: (v) -> @at -1, v

  constructor: (args...) ->
    super()

    if args.length == 1 and Z.isNativeArray(args[0])
      @__array__ = args[0].slice 0
    else
      @__array__ = new NativeArray args...

  isZArray: true,

  toString: ->
    a = @invoke('toString').join ', '
    "#<#{@constructor.className()}:#{@objectId()} [#{a}]>"

  toNative: -> @__array__

  each: (f) -> f item, idx for item, idx in @__array__; @

  join: (s) -> @__array__.join Z.toString(s)

  at: (i, v) ->
    len = @length()
    i   = len + i if i < 0

    if typeof v == 'undefined'
      if i >= 0 and i < len then @__array__[i] else null
    else
      @splice i, 1, v
      v

  splice: (i, n, items...) ->
    len = @length()
    idx = if i < 0 then len + i else i

    if idx < 0
      throw new Error("Z.Array#splice: index `#{i}` is too small for #{@toString()}")

    if typeof n == 'undefined'
      @.__array__.splice(idx)
      return @

    if idx >= len
      @__array__.length = idx

    @__array__.splice(idx, n, items...)
    @

  slice: (i, n) ->
    len = @length()
    i   = len + i if i < 0

    return null if i < 0 or i >= len

    if typeof n == 'undefined'
      a = @__array__.slice i
    else
      a = @__array__.slice(i, i + n)

    Z.A a

  slice$: (i, n) ->
    a = @slice i, n
    return a if a == null
    @splice i, n
    a

  eq: (other) ->
    return false unless other instanceof Z.Array
    return false unless @length() == other.length()
    for item, idx in @__array__
      return false unless Z.eq item, other.__array__[idx]
    true

  push: (items...) -> @splice @length(), 0, items...

  concat: (items...) ->
    a = for item in items
      if item?.isZArray then item.toNative() else item

    Z.A @toNative().concat a...

  unshift: (items...) -> @splice 0, 0, items...

  pop: (n) ->
    if typeof n != 'undefined' && n < 0
      throw new Error('Z.Array#pop: array size must be positive')

    len = @length()
    return null if len == 0

    if typeof n != 'undefined'
      n = len if n > len
      @slice$ -n, n
    else
      @slice$(-1, 1).at 0

  shift: (n) ->
    if typeof n != 'undefined' && n < 0
      throw new Error('Z.Array#shift: array size must be positive')

    len = @length()
    return null if len == 0

    if typeof n != 'undefined'
      n = len if n > len
      @slice$ 0, n
    else
      @slice$(0, 1).at 0

  flatten: ->
    result = Z.A()

    for item in @__array__
      if item and item.isZArray
        result.push item.flatten().toNative()...
      else if Z.isNativeArray item
        result.push Z.A(item).flatten().toNative()...
      else
        result.push item

    result

  getUnknownProperty: (k) ->
    @map (item) -> item.get k

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

    return super if paths.length > 1

    [head, tail...] = paths[0].split '.'

    switch head
      when "@count"
        @length()
      when "@max"
        @get(tail.join '.').inject (acc, item) ->
          if acc > item then acc else item
      when "@min"
        @get(tail.join '.').inject (acc, item) ->
          if acc < item then acc else item
      when "@sum"
        @get(tail.join '.').inject (acc, item) -> acc + item
      when "@avg"
        sum   = ['@sum'].concat(tail).join('.')
        count = ['@count'].concat(tail).join('.')
        @get(sum) / @get(count)
      else super

# shortcut for instantiating a new array
Z.A = (args...) -> new Z.Array args...

