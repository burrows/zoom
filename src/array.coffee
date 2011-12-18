class Z.Array extends Z.Object
  NativeArray = Z.root.Array

  @mixin Z.Enumerable

  @property 'length',
    get: -> @__array__.length
    set: (v) -> @__array__.length = v

  @property 'first',
    get: -> @at 0
    set: (v) -> @at 0, v

  @property 'last',
    get: -> @at -1
    set: (v) -> @at -1, v

  @property '@',
    readonly: true
    get: -> this

  constructor: (args...) ->
    super()

    if args.length == 1 and Z.isNativeArray(args[0])
      @__array__ = args[0].slice 0
    else
      @__array__ = new NativeArray args...

  isZArray: true,

  toString: ->
    a = @map((item) -> Z.toString item).join ', '
    "#<#{@constructor.className()}:#{@objectId()} [#{a}]>"

  toNative: -> @__array__

  each: (f) -> f item, idx for item, idx in @__array__; return this

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
      willMutate(this, 'remove', idx, len - idx) if idx < len
      @__array__.splice(idx)
      didMutate(this, 'remove', idx, len - idx) if idx < len
      return this

    expand     = idx >= len
    replaceNum = if expand then 0 else Z.min(n, items.length)
    replaceIdx = idx
    insertNum  = items.length - replaceNum
    insertIdx  = idx + replaceNum
    removeNum  = if expand then 0 else n - replaceNum
    removeIdx  = idx + replaceNum

    willMutate(this, 'replace', replaceIdx, replaceNum) if replaceNum > 0
    willMutate(this, 'insert',  insertIdx,  insertNum)  if insertNum  > 0
    willMutate(this, 'remove',  removeIdx,  removeNum)  if removeNum  > 0

    if expand
      @__array__.length = idx

    @__array__.splice(idx, n, items...)

    didMutate(this, 'replace', replaceIdx, replaceNum) if replaceNum > 0
    didMutate(this, 'insert',  insertIdx,  insertNum)  if insertNum  > 0
    didMutate(this, 'remove',  removeIdx,  removeNum)  if removeNum  > 0

    return this

  willMutate = (array, type, idx, n) ->
    len      = array.length()
    itemKeys = itemObserverKeys array
    oldItems = array.slice idx, n

    switch type
      when 'insert'
        array.willChangeProperty 'length'
        array.willChangeProperty 'first' if idx == 0
        array.willChangeProperty 'last' if idx >= len
        array.willChangeProperty '@',
          type  : 'insert'
          range : [idx, n]
          old   : undefined
      when 'remove'
        array.willChangeProperty 'length'
        array.willChangeProperty 'first' if idx == 0
        array.willChangeProperty 'last' if idx + n == len
        array.willChangeProperty '@',
          type  : 'remove'
          range : [idx, n]
          old   : oldItems
        deregisterItemObservers array, oldItems.toNative()
      when 'replace'
        array.willChangeProperty 'first' if idx == 0
        array.willChangeProperty 'last' if idx == len - 1
        array.willChangeProperty '@',
          type  : 'replace'
          range : [idx, n]
          old   : oldItems
        deregisterItemObservers array, oldItems.toNative()

    array.willChangeProperty(key) for key in itemKeys

  didMutate = (array, type, idx, n) ->
    len      = array.length()
    itemKeys = itemObserverKeys array
    newItems = array.slice idx, n

    switch type
      when 'insert'
        array.didChangeProperty 'length'
        array.didChangeProperty 'first' if idx == 0
        array.didChangeProperty 'last' if idx + n == len
        array.didChangeProperty '@',
          type  : 'insert'
          range : [idx, n]
          new   : newItems
        registerItemObservers array, newItems.toNative()
      when 'remove'
        array.didChangeProperty 'length'
        array.didChangeProperty 'first' if idx == 0
        array.didChangeProperty 'last' if idx + n > len
        array.didChangeProperty '@',
          type  : 'remove'
          range : [idx, n]
          new   : undefined
      when 'replace'
        array.didChangeProperty 'first' if idx == 0
        array.didChangeProperty 'last' if idx == len - 1
        array.didChangeProperty '@',
          type  : 'replace'
          range : [idx, n]
          new   : newItems
        registerItemObservers array, newItems.toNative()

    array.didChangeProperty(key) for key in itemKeys

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

  getUnknownProperty: (k) -> @pluck(k).flatten()

  registerUnknownObserver: (registration) ->
    ((@__registrations__ ?= {})[registration.head] ?= []).push registration
    registerItemObservers(this, @toNative())

  deregisterUnknownObserver: (rpath, opath, observee, observer, action) ->

  registerItemObservers = (array, items) ->
    for key in itemObserverKeys(array)
      for registration in array.__registrations__[key]
        {path, head, tail, observee, observer, action, opts} = registration

        for item in items
          item.registerObserver([head].concat(tail), path, observee, observer,
            action, opts)

  deregisterItemObservers = (array, items) ->
    for key in itemObserverKeys(array)
      for registration in array.__registrations__[key]
        {path, head, tail, observee, observer, action, opts} = registration

        for item in items
          item.deregisterObserver([head].concat(tail), path, observee, observer,
            action)

  itemObserverKeys = (array) ->
    keys = []

    for key, registration of (array.__registrations__ || {})
      keys.push(key) unless array.constructor.hasProperty(key)

    keys

  _get: (path) ->
    [head, tail...] = path

    switch head
      when "@count"
        @length()
      when "@max"
        @_get(tail).inject (acc, item) -> Z.max acc, item
      when "@min"
        @_get(tail).inject (acc, item) -> Z.min acc, item
      when "@sum"
        @_get(tail).inject (acc, item) -> acc + item
      when "@avg"
        sum   = ['@sum'].concat(tail)
        count = ['@count'].concat(tail)
        @_get(sum) / @_get(count)
      else super

# shortcut for instantiating a new array
Z.A = (args...) -> new Z.Array args...

