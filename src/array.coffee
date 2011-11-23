class Z.Array extends Z.Object
  NativeArray = Z.root.Array

  constructor: () ->
    super

    @__array__ = new NativeArray arguments...

  @fromNative: (a) -> new Z.Array a...

  toString: ->
    a = _.invoke(@__array__, 'toString').join(', ')
    "#<#{@constructor.className()}:#{@objectId()} [#{a}]>"

  toNative: -> @__array__

  length: -> @__array__.length

  at: (i) ->
    len = @length()
    i   = len + i if i < 0

    if i >= 0 and i < len then @__array__[i] else null

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

  isEqual: (other) ->
    return false unless other instanceof Z.Array
    _.isEqual @__array__, other.__array__

  first: -> @__array__[0]

  last: -> @__array__[@__array__.length - 1]

  push: (item) -> @splice(@__array__.length, 1, item); @

  pop: -> item = @last(); @splice(@__array__.length - 1, 1); item

Z.A = Z.Array.fromNative

