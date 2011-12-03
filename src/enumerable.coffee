Z.Enumerable = new Z.Mixin ->
  @instance
    isEnumerable: true

    map: (f) ->
      results = new Z.Array
      @each (item) -> results.push(f item)
      results

    first: () ->
      try
        @each (item) -> throw item
      catch first
        return first

    inject: (initial, f) ->
      skip = false
      if arguments.length == 1
        f = initial
        initial = @first()
        skip = true

      acc = initial
      @each (item) ->
        if skip
          skip = false
          return
        acc = f acc, item
      acc
  
    reject: (f) ->
      @inject new Z.Array, (acc, item) -> acc.push item unless f item; acc

    invoke: (name) -> @map (item) -> item[name]()

