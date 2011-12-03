Z.Equatable = new Z.Mixin ->
  @instance
    isEquatable: true
    eq: (other) -> !@neq(other)
    neq: (other) -> !@eq(other)

# FIXME: do a deep object comparison when given native objects
Z.eq = (a, b) ->
  return a.eq b if a and a.isEquatable
  a == b
