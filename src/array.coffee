class Z.Array extends Z.Object
  NativeArray = Z.root.Array

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

  getUnknownProperty: (k) ->
    _.map @__array__, (item) -> item.get k

  get: (paths...) ->
    paths = _.flatten paths

    return super if paths.length > 1

    [head, tail...] = paths[0].split '.'

    switch head
      when "@count"
        @length()
      when "@max"
        _.max @get(tail.join '.'), (item) -> item?.valueOf()
      when "@min"
        _.min @get(tail.join '.'), (item) -> item?.valueOf()
      when "@sum"
        _.reduce @get(tail.join '.'), ((acc, item) -> acc + (item?.valueOf() || 0)), 0
      when "@avg"
        sum   = ['@sum'].concat(tail).join('.')
        count = ['@count'].concat(tail).join('.')
        @get(sum) / @get(count)
      else super

# shortcut for instantiating a new array
Z.A = (args...) -> new Z.Array args...

