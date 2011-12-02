Z.Enumerable = new Z.Mixin ->
  @instance
    isEnumerable: true

    map: (f) ->
      results = new Z.Array
      @each (i) -> results.push(f i)
      results
  
