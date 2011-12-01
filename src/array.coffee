class Z.Array extends Z.Object
  NativeArray = Z.root.Array

  @property 'length',
    get: -> @__array__.length
    set: (v) -> @__array__.length = v

  constructor: (args...) ->
    super

    if args.length == 1 and _.isArray(args[0])
      @__array__ = args[0].slice 0
    else
      @__array__ = new NativeArray args...

  toString: ->
    a = _.invoke(@__array__, 'toString').join(', ')
    "#<#{@constructor.className()}:#{@objectId()} [#{a}]>"

  toNative: -> @__array__

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

  isEqual: (other) ->
    return false unless other instanceof Z.Array
    _.isEqual @__array__, other.__array__

  first: -> @at 0

  last: -> @at -1

  push: (items...) -> @splice @length(), 0, items...

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

# shortcut for instantiating a new array
Z.A = (args...) -> new Z.Array args...

