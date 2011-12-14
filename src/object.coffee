# `Z.Object` sits at the top of the Zoom object hierarchy and implements the
# key-value coding and key-value observing machinery.
#
# The KVC/KVO implementation is highly influenced by Cocoa:
#
# * [Key-Value Coding Programming Guide](http://developer.apple.com/library/mac/#documentation/Cocoa/Conceptual/KeyValueCoding/Articles/KeyValueCoding.html)
# * [Key-Value Observing Programming Guide](http://developer.apple.com/library/mac/#documentation/Cocoa/Reference/Foundation/Protocols/NSKeyValueObserving_Protocol/Reference/Reference.html#//apple_ref/occ/cat/NSKeyValueObserving)
class Z.Object
  # Private: Stores an auto-incrementing id used by the `Z.Object` constructor.
  objectId = 1

  # Private: A list of namespaces to use to look up the name of a class. Used by
  # `Z.Object#className`. This list can be modified by using the
  # `Z.Object.addNamespace` and `.removeNamespace` methods.
  namespaces = [ [Z, 'Z'], [Z.root, ''] ]

  # Private: A hash containing the default values for properties defined using
  # `Z.Object.property`.
  defaultPropertyOpts =
    dependsOn: []
    cache: true
    auto: true
    get: null
    set: null

  # Add a namespace to search for class objects. You should register your app's
  # namespace using this method so that any classes you define on your app
  # object will have nice string representations (which are useful for
  # debugging).
  #
  # * `o`    - The namespace object.
  # * `name` - A string containg the name of the namespace (default: `''`).
  #
  # Returns nothing.
  @addNamespace: (o, name = '') -> namespaces.push [o, name]; null

  # Removes a namespace previously added with `addNamespace`.
  #
  # * `o` - The namespace object to remove.
  #
  # Returns nothing.
  @removeNamespace: (o) ->
    namespaces = namespaces.filter (namespace) -> namespace[0] != o
    null

  # Returns the name of the class if it can be found by searching through the
  # registered namespaces.
  #
  # Returns the name of the class or `"(Unknown)"` if it can't be located.
  @className: ->
    for namespace in namespaces
      for own k, v of namespace[0]
        if v == this
          return if namespace[1].length > 0 then "#{namespace[1]}.#{k}" else k

    '(Unknown)'

  # Overrides the class's `toString` method to return its name instead of the
  # default behavior which is to return the source code of the constructor
  # function.
  @toString: @className

  # Define a property on the class. In order to use Zoom's KVC and KVO systems,
  # you must use `@property` to define getter and setter methods for your
  # class's instance variables.
  #
  # Defining a property using `@property` does the following:
  #
  # 1. Registers a property descriptor with the class (see `propertyDescriptors`
  #    method). This allows the `Z.Object#get` and `#set` methods to access your
  #    property.
  # 2. Defines an accessor method on your class with the given name that can be
  #    used to get and set the property in a KVO compliant way. Using this
  #    generated method is equivalent to using `#get` and `#set` and passing in
  #    the name of the property.
  #
  # Consider the following example:
  #
  #     Z.Object.addNamespace(App = {})
  #     class App.Person extends Z.Object
  #       @property 'first'
  #       @property 'last'
  #       @property 'full',
  #         get: -> @first() + ' ' + @last()
  #         set: (name) ->
  #           [first, last] = name.split ' '
  #           @first first
  #           @last last
  #
  # New person objects can be instantiated by using the `new` operator, passing
  # in any properties you wish to set:
  #
  #     p = new App.Person first: 'Michael', last: 'Jordan'
  #
  # You can then use the generated accessor methods or `#get` and `#set` to
  # modify the properties:
  #
  #     p.first()      # => "Michael"
  #     p.get('first') # => "Michael"
  #     p.last()       # => "Jordan"
  #     p.get('last')  # => "Jordan"
  #     p.full()       # => "Michael Jordan"
  #     p.get('full')  # => "Michael Jordan"
  #     p.toString()   # => #<Person:1 @first=Michael, @last=Jordan, @full=Michael Jordan>
  #
  #     p.first('Scottie')
  #     p.set('last', 'Pippen')
  #     p.toString()   # => #<Person:1 @first=Scottie, @last=Pippen, @full=Scottie Pippen>
  #
  #     p.name('Dennis Rodman')
  #     p.toString()   # => #<Person:1 @first=Dennis, @last=Rodman, @full=Dennis Rodman>
  #
  # * `name` - A string containing the name of the property.
  # * `opts` - A native js object containing one or more of the following:
  #   * `dependsOn` - Pass a list of keys or key paths that the property depends
  #                   on.
  #   * `cache`     - Controls whether or not the property value is cached after
  #                   being calculated. Use the `dependsOn` option to
  #                   automatically invalidate the cache when a dependent key
  #                   changes.
  #   * `auto`      - The key-value observing system will automatically notifiy
  #                   observers of the property when it changes when this option
  #                   is set. If set to `false`, you should use the
  #                   `propertyWillChange` and `propertyDidChange` methods when
  #                   your setter actually changes the property. Setting this to
  #                   `false` only make sense when you have defined a custom
  #                   setter using the `set` option.
  #   * `get`       - By default, when properties are retrieved via `#get` or
  #                   the generated accessor method the actual value is read
  #                   from a raw property with the name `__<property>__`. You
  #                   can use this option to override that behavior by setting
  #                   it to a function that calculates the property value.
  #   * `set`       - By default, when properties are set via `#set` or the
  #                   generated accessor method the value is stored on a raw
  #                   property with the name `__<property>__`. You can use this
  #                   option to override that behavior by setting it to a
  #                   function that stores the given value.
  #
  # Returns nothing.
  @property: (name, opts = {}) ->
    opts = Z.defaults opts, defaultPropertyOpts

    @["__property__#{name}__"] = opts

    @prototype[name] = (v) ->
      if typeof v == 'undefined'
        getProperty this, name
      else
        setProperty this, name, v

    null

  # Returns a list of property descriptors defined on this class. A property
  # descriptor is simply a native js object containing all of the options used
  # to define the property.
  @propertyDescriptors: ->
    props = {}

    for own k, v of this
      if match = k.match(/^__property__(\w+)__$/)
        props[match[1]] = v

    props

  # Checks if the class has a property by the given name.
  #
  # * `name` - The name of the property.
  #
  # Returns `true` if the class implements a property with the given name and
  # `false` otherwise.
  @hasProperty: (name) -> typeof @["__property__#{name}__"] == 'object'

  # Mixes in an instance of `Z.Mixin` to the class.
  #
  # * `mixin` - An instance of `Z.Mixin`.
  #
  # Returns nothing.
  @mixin: (mixin) ->
    for own k, v of mixin.class()
      @[k] = v

    for own k, v of mixin.instance()
      @prototype[k] = v

    for own k, v of mixin.property()
      @property k, v

    null

  # Makes `Z.Object` equatable. You'll likely want to override the `#eq` or
  # `#neq` method in subclasses in order to implement more meaningful object
  # comparison.
  @mixin Z.Equatable

  # Initialize a new instance of `Z.Object`. Assigns a unique object id and sets
  # any given property values.
  #
  # * `properties` - A native object containing property values (defaults to
  #                  `{}`).
  #
  # Returns the instance.
  constructor: (properties = {}) ->
    @__objectId__ = objectId++
    @set properties
    return this

  @property 'objectId', { readonly: true, get: -> @__objectId__ }

  isZObject: true

  toString: ->
    s     = "#<#{@constructor.className()}:#{@objectId()}"
    props = []

    for own name of @constructor.propertyDescriptors()
      props.push "@#{name}=#{@get name}" unless name == 'objectId'

    s += " #{props.join ', '}" if props.length > 0
    s += ">"

  eq: (o) -> this == o

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

    if paths.length > 1
      result = {}
      result[path] = @_get(path.split '.') for path in paths
      result
    else
      @_get paths[0].split('.')

  _get: (path) ->
    [head, tail...] = path

    if tail.length > 0 then getProperty(this, head)?._get(tail)
    else getProperty this, head

  set: (path, value) ->
    if arguments.length == 1
      @set k, v for own k, v of path
      return null

    [init..., last] = path.split '.'

    if init.length > 0 then @_get(init)?.set last, value
    else setProperty this, path, value

    null

  defaultObserveOpts =
    old: false
    new: false
    fire: false
    prior: false

  # options:
  #   old - set to true to receive the old value in the notification (default: false)
  #   new - set to true to receive the new value in the notification (default: false)
  #   fire - set to true to trigger the notification immediately (default: false), may
  #     contain the new value if new option is set, but will never contain the old value
  #   prior - send a notification prior to the change being made, a notification
  #     will still be sent after the change has been made, will never contain the new value
  #   context - object to pass along in notification
  observe: (path, observer, action, opts = {}) ->
    [head, tail...] = path.split '.'
    registration    = Z.merge Z.defaults(opts, defaultObserveOpts),
      path     : path
      head     : head
      tail     : tail
      observee : this
      observer : observer
      action   : action
      callback : if typeof action == 'function' then action else observer[action]

    ((@__registrations__ ?= {})[head] ?= []).push registration

    if tail.length > 0 and val = @get(head)
      registerSegmentObservers val, tail, registration

    if opts.fire
      notification = path: path, observee: this
      notification.new     = @get(path) if registration.new
      notification.context = registration.context if registration.context
      registration.callback.call registration.observer, notification

    return this

  registerSegmentObservers = (object, path, registration) ->
    [head, tail...] = path
    registration    = Z.merge {}, registration, head: head, tail: tail

    ((object.__registrations__ ?= {})[path] ?= []).push registration

    if tail.length > 0 and val = object.get(head)
      registerSegmentObservers val, tail, registration

  deregisterSegmentObservers = (object, path, registration) ->
    [head, tail...] = path
    registrations   = object.__registrations__?[head]
    indexes         = []

    for reg, idx in registrations
      if reg.action == registration.action and reg.observer == registration.observer
        indexes.unshift idx

    registrations.splice(idx, 1) for idx in indexes

    if tail.length > 0 and val = object.get(head)
      deregisterSegmentObservers val, tail, registration

  stopObserving: (path, observer, action) ->
    [head, tail...] = path.split '.'

    return unless registrations = @__registrations__?[head]

    indexes = []
    val     = @get head

    for registration, idx in registrations
      if registration.observer == observer && registration.action == action
        indexes.unshift idx

        if tail.length > 0 and val
          deregisterSegmentObservers val, tail, registration

    # FIXME: raise an exception here if no indexes were found?
    registrations.splice(idx, 1) for idx in indexes

    return this

  willChangeProperty: (k) ->
    return unless registrations = @__registrations__?[k]

    for registration in registrations
      {path, observee} = registration

      notification = path: path, observee: observee

      notification.old     = observee.get(path) if registration.old
      notification.context = registration.context if registration.context

      if registration.tail.length > 0 and val = @get(k)
        deregisterSegmentObservers val, registration.tail, registration

      if registration.prior
        notification.isPrior = true
        registration.callback.call registration.observer, notification
        notification = Z.merge {}, notification
        delete notification.isPrior

      registration.notification = notification

  didChangeProperty: (k) ->
    return unless registrations = @__registrations__?[k]

    for registration in registrations
      {notification, path, observee, observer, callback} = registration
      delete registration.notification

      notification.new = observee.get(path) if registration.new

      if registration.tail.length > 0 and val = @get(k)
        registerSegmentObservers val, registration.tail, registration

      callback.call observer, notification

  getUnknownProperty: (k) ->
    throw new Error "#{@constructor.className()}#get: undefined key `#{k}` for #{@toString()}"

  setUnknownProperty: (k, v) ->
    throw new Error "#{@constructor.className()}#set: undefined key `#{k}` for #{@toString()}"

  #-----------------------------------------------------------------------------
  # Private Methods
  #-----------------------------------------------------------------------------

  nextObjectId = -> objectId++

  getProperty = (o, k) ->
    prop = o.constructor["__property__#{k}__"]
    return o.getUnknownProperty(k) unless prop
    if prop.get then prop.get.call(o) else o["__#{k}__"]

  setProperty = (o, k, v) ->
    prop = o.constructor["__property__#{k}__"]
    return o.setUnknownProperty(k, v) unless prop

    o.willChangeProperty(k) if prop.auto

    if prop.set
      prop.set.call o, v
    else
      o["__#{k}__"] = v

    o.didChangeProperty(k) if prop.auto

