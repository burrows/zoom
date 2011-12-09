Z.Orderable = new Z.Mixin ->
  @instance
    isOrderable: true

    cmp: (other) ->
      throw new Error 'Z.Orderable#cmp: must implement in subclass'

    lt: (other) -> @cmp(other) < 0

    lte: (other) -> @cmp(other) <= 0

    gt: (other) -> @cmp(other) > 0

    gte: (other) -> @cmp(other) >= 0

    max: (other) -> if @cmp(other) >= 0 then this else other

    min: (other) -> if @cmp(other) <= 0 then this else other

# FIXME: do a better comparison on native objects
Z.cmp = (a, b) ->
  return a.cmp b if a and a.isOrderable
  if a < b then -1
  else if a > b then 1
  else 0

Z.max = (a, b) -> if Z.cmp(a, b) >= 0 then a else b
Z.min = (a, b) -> if Z.cmp(a, b) <= 0 then a else b
