class Z.Mixin
  constructor: (f) ->
    @_class    = {}
    @_instance = {}
    @_property = {}

    f.call @ if f

  class: (o) ->
    if arguments.length == 0
      @_class
    else
      @_class[k] = v for own k, v of o

  instance: (o) ->
    if arguments.length == 0
      @_instance
    else
      @_instance[k] = v for own k, v of o

  property: (name, opts = {}) ->
    if arguments.length == 0
      @_property
    else
      @_property[name] = opts

