// `Z.Observable` is a module that implements the core of the Zoom key-value
// coding (KVC) and key-value observing (KVO) system. The KVO system is built on
// top of `Z.Emitter` using the `willChange:` and `didChange:` events. These
// events are emitted whenever a property is changed with the namespace set to
// the name of the property that changed. Additionally, `Z.Observable` overrides
// the `on` and `off` methods from `Z.Emitter` in order to implement property
// path observers. When a handler is created via the `on` method for a
// `willChange:` or `didChange:` event with a namespace that is a property path,
// the `Z.Observable` object will start emitting these events whenever any segment
// of the path changes.
//
// The KVC/KVO implementation is highly influenced by Cocoa:
//
// * [Key-Value Coding Programming Guide](http://developer.apple.com/library/mac/#documentation/cocoa/conceptual/KeyValueCoding/Articles/KeyValueCoding.html)
// * [Key-Value Observing Programming Guide](http://developer.apple.com/library/mac/#documentation/cocoa/conceptual/KeyValueObserving/KeyValueObserving.html)
Z.Observable = Z.Module.extend(Z.Emitter, function() {
  var slice = Array.prototype.slice,

  // Internal: An object containing the default values for properties defined
  // using `Z.Observable.prop`.
  defaultPropertyOpts = {
    dependsOn : [],
    auto      : true,
    get       : null,
    set       : null,
    readonly  : false,
    def       : null,
    cache     : false
  },

  // Internal: A regex to test whether an event name is a special `Z.Observable`
  // event.
  observableEventRe = /^(?:willChange|didChange|\*):/;

  // Internal: Returns the current value of the property indicated by the given
  // key. If a property with the given name does not exist, the
  // `getUnknownProperty` method is invoked on the receiver. If the property has
  // yet to be set, then the default value for the property is returned.
  //
  // k - The name of the key to get.
  //
  // Returns the current value of the property.
  function getProperty(k) {
    var desc  = this['__z_property_' + k + '__'],
        prop  = '__' + k + '__',
        cache = '__' + k + '_' + 'cached' + '__',
        v;

    if (!desc) { return this.getUnknownProperty(k); }
    if (desc.cache && this.hasOwnProperty(cache)) { return this[cache]; }

    v = desc.get ? desc.get.call(this) : this[prop];
    v = (v === undefined || v === null) ? desc.def : v;

    if (desc.cache) { this[cache] = v; }

    return v;
  }

  // Internal: Sets the value for a property. If a property with the given name
  // does not exist, the `setUnknownProperty` method is invoked on the reciever.
  // If the property has automatic emitters turned on (the default) then
  // observers are also notified by emitting the `willChange:<property>` and
  // `didChange:<property>` events.
  //
  // k - The name of the key to set.
  // v - The value to set.
  //
  // Returns `v`.
  // Throws `Error` if the property is marked as readonly.
  function setProperty(k, v) {
    var prop = this['__z_property_' + k + '__'];
    if (!prop) { return this.setUnknownProperty(k, v); }

    if (prop.readonly) {
      throw new Error(Z.fmt("Z.Object.set: attempted to set readonly property `%@` for %@", k, this));
    }

    if (prop.auto) { this.emit('willChange:' + k); }

    if (prop.set) { prop.set.call(this, v); }
    else { this['__' + k + '__'] = v; }

    if (prop.auto) { this.emit('didChange:' + k); }

    return v;
  }

  // Internal: Handler function that gets invoked when a dependent property path
  // will change. Emits a new event for the dependent property.
  function dependentPathWillChange(event, data, k) {
    this.emit('willChange:' + k);
  }

  // Internal: Handler function that gets invoked when a dependent property path
  // has changed. Emits a new event for the dependent property.
  function dependentPathDidChange(event, data, k) {
    delete this['__' + k + '_' + 'cached' + '__'];
    this.emit('didChange:' + k);
  }

  // Internal: Registers observers for all properties defined with the
  // `dependsOn` option.
  //
  // Returns nothing.
  function observeDependentPaths() {
    var descs = this.propertyDescriptors(), desc, k, i, len;

    for (k in descs) {
      desc = descs[k];
      for (i = 0, len = desc.dependsOn.length; i < len; i++) {
        this.on('willChange:' + desc.dependsOn[i], dependentPathWillChange, {
          context: k
        });
        this.on('didChange:' + desc.dependsOn[i], dependentPathDidChange, {
          context: k
        });
      }
    }
  }

  // Public: The default `Z.Observable` initializer. Takes a native object
  // mapping property names to values and sets each on the object.
  //
  // props - A native object containing property/value pairs (default: null).
  //
  // Returns the receiver.
  this.def('init', function(props) {
    if (props) { this.set(props); }
    observeDependentPaths.call(this);
    return this.supr();
  });

  // Public: The `Z.Observable` destructor. Removes any observers on the object.
  //
  // Returns the receiver.
  this.def('destroy', function() {
    var event, path;

    // remove any existing unknown observers
    for (event in this.__z_on__) {
      if (observableEventRe.test(event)) {
        path = event.split(':')[1];

        if (!this.hasProperty(path) && path !== '*') {
          this.teardownUnknownObserver(path, path, this);
        }
      }
    }

    return this.supr();
  });

  // Public: Defines a property on the object. In order to use Zoom's KVC and
  // KVO systems, you must use this method to define properties.
  //
  // Defining a property does the following:
  //
  // 1. Registers a property descriptor (see `propertyDescriptors` method). This
  //    allows the `get` and `set` methods to access the property.
  // 2. Defines an accessor method with the given name that can be used to get
  //    and set the property in a KVO compliant way. Calling this method with no
  //    arguments is equivalent to getting the property with `get` and calling
  //    it with one argument is equivalent to setting the property with `set`.
  //
  // Examples
  //
  //   App.Person = Z.Object.extend(function() {
  //     this.prop('first');
  //     this.prop('last');
  //     this.prop('full', {
  //       get: function() { return this.first() + ' ' + this.last(); },
  //       set: function(name) {
  //         var names = name.split(' ');
  //         this.first(names[0]);
  //         this.last(names[1]);
  //       }
  //     });
  //   });
  //
  //   // Concrete `App.Person` instances can be created by using the `create`
  //   // method, passing in any properties you wish to set:
  //
  //   p = App.Person.create({first: 'Michael', last: 'Jordan'});
  //
  //   // You can then use the generated accessor methods or `get` and `set` to
  //   // modify the properties:
  //
  //   p.first()      // => 'Michael'
  //   p.get('first') // => 'Michael'
  //   p.last()       // => 'Jordan'
  //   p.get('last')  // => 'Jordan'
  //   p.full()       // => 'Michael Jordan'
  //   p.get('full')  // => 'Michael Jordan'
  //   p.toString()   // => '#<App.Person:18 first: 'Michael', last: 'Jordan'>'
  //
  //   p.first('Scottie')
  //   p.set('last', 'Pippen')
  //   p.toString()   // => '#<App.Person:18 first: 'Scottie', last: 'Pippen'>'
  //
  //   p.full('Dennis Rodman')
  //   p.toString()   // => '#<App.Person:18 first: 'Dennis', last: 'Rodman'>'
  //
  // name - A string containing the name of the property.
  // opts - A native object containing zero or more of the following:
  //   dependsOn - Pass a list of keys or key paths that the property depends
  //               on. This should be used for computed properties to allow them
  //               to be observed. Its especially important to declare all
  //               dependent paths for cached properties in order to clear the
  //               cache when any dependencies change.
  //   auto      - The key-value observing system will automatically notify
  //               observers of the property when it changes when this option is
  //               set. If set to `false`, you should manually emit the
  //               `willChange:<name>` and `didChange:<name>` events when
  //               actually making changes the property. Setting this to`false`
  //               only make sense when you have defined a custom setter using
  //               the `set` option.
  //   get       - By default, when properties are retrieved via `get` or the
  //               generated accessor method the actual value is read from a raw
  //               property with the name `__<name>__`. You can use this option
  //               to override that behavior by setting it to a function that
  //               calculates the property value. Be sure to specify any
  //               dependent properties with the `dependsOn` option.
  //   set       - By default, when properties are set via `set` or the
  //               generated accessor method the value is stored on a raw
  //               property with the name `__<name>__`. You can use this option
  //               to override that behavior by setting it to a function that
  //               stores the given value.
  //   readonly  - Prevents setting of the property. Any attempts to set the
  //               property will throw an exception.
  //   def       - Specify a default value for the property.
  //   cache     - Caches the result the first time the property is computed and
  //               returns the cached value on subsequent gets. The cache will
  //               be cleared when any `dependsOn` paths change.
  //
  // Returns the receiver.
  this.def('prop', function(name, opts) {
    opts = Z.merge({}, defaultPropertyOpts, opts);

    this['__z_property_' + name + '__'] = opts;

    if (name.match(/^[\w$]+/)) {
      this.def(name, function(v) {
        if (arguments.length === 0) { return getProperty.call(this, name); }
        else { return setProperty.call(this, name, v); }
      });
    }

    return this;
  });

  // Public: Returns a native object mapping the names of all the properties
  // defined on the receiver to the options they were created with.
  //
  // Returns a native object.
  this.def('propertyDescriptors', function() {
    var props = {}, k, match;

    for (k in this) {
      if ((match = k.match(/^__z_property_(.*)__$/))) {
        props[match[1]] = this[k];
      }
    }

    return props;
  });

  // Public: Returns a boolean indicating whether or not the object has a
  // property of the given name.
  //
  // name - A string containing the name of the property to check for.
  //
  // Returns `true` if the object has a property of the given name and `false`
  //   otherwise.
  this.def('hasProperty', function(name) {
    return typeof this['__z_property_' + name + '__'] === 'object';
  });

  // Public: Get the value of a key path or a list of key paths. When given a
  // single string argument, this method returns the value of the property at
  // the end of the path represented by the string. When given multiple
  // arguments or a single argument that is a native array, a native array is
  // returned containing the values of all the given paths.
  //
  // *paths - The list of key paths to get. At least one path must be given, but
  //          multiple paths can be given as multiple arguments or a single
  //          native array argument.
  //
  // Returns the value of the given key path when given a single string
  //   argument.
  // Returns a native array containing the values of all given key paths when
  //   given multiple arguments or a single native array argument.
  this.def('get', function() {
    var paths, i, len, result;

    if (arguments.length === 1) {
      if (Z.isArray(arguments[0])) {
        paths = arguments[0];
      }
      else if (Z.isA(arguments[0], Z.Array)) {
        paths = arguments[0].toNative();
      }
      else {
        paths = [arguments[0]];
      }
    }
    else {
      paths = slice.call(arguments);
    }

    if (paths.length > 1) {
      result = {};
      for (i = 0, len = paths.length; i < len; i++) {
        result[paths[i]] = Z.get(this, paths[i]);
      }
    }
    else {
      result = Z.get(this, paths[0]);
    }

    return result;
  });

  // Internal: Called by `Z.get` to retrieve a property value from
  // `Z.Observable` objects.
  this.def('_get', getProperty);

  // Public: Sets the value of a key path or paths. When given two arguments,
  // the second argument is set as the value for the property indicated by the
  // first. When given a native object, each key/value pair in the object is
  // set.
  //
  // path  - A string containing a key path or a native object containing paths
  //         as the keys and property values as the values.
  // value - The value to set the key path to.
  //
  // Examples
  //
  //   var p = App.Person.create();
  //
  //   p.set('first', 'Michael');
  //   p.set('last', 'Jordan');
  //   p.set({first: 'Scottie', last: 'Pippen'});
  //
  // Returns `value` with given a key and value.
  // Returns the object when given a native object.
  this.def('set', function(path, value) {
    var k;

    if (arguments.length === 1) {
      for (k in path) {
        if (path.hasOwnProperty(k)) {
          Z.set(this, k, path[k]);
        }
      }

      return path;
    }

    Z.set(this, path, value);

    return value;
  });

  // Internal: Called by `Z.set` to set property values on `Z.Observable`
  // objects.
  this.def('_set', setProperty);

  // Public: Sets the value of the key path to the given value unless the
  // current value of the key path is already equal to the given value (as
  // determined by `Z.eq`).
  //
  // This is useful for cases where its important to avoid emitting change
  // events when the value hasn't actually changed.
  //
  // path  - A string containing a key path or a native object containing paths
  //         as the keys and property values as the values..
  // value - The value to set the key path to.
  //
  // Returns `value`.
  this.def('setif', function(path, value) {
    var k;

    if (arguments.length === 1) {
      for (k in path) {
        if (!path.hasOwnProperty(k)) { continue; }
        if (!Z.eq(this.get(k), path[k])) { Z.set(this, k, path[k]); }
      }

      return path;
    }

    if (!Z.eq(this.get(path), value)) { this.set(path, value); }

    return value;
  });

  // Internal: Returns a boolean indicating whether or not the given path is
  // currently being observed.
  function hasObserverFor(path) {
    return this.__z_on__ &&
      (this.__z_on__['willChange:' + path] ||
       this.__z_on__['didChange:' + path]);
  }

  // Internal: Overrides `Z.Emitter.on` to handle the setup of property path
  // observers. If the given event is a `willChange:` or `didChange:` event and
  // the namespace does not match a propery name, then the namespace is assumed
  // to be a property path and the `setupUnknownObserver` method is called. The
  // `setupUnknownObserver` method sets up the appropriate internal observers
  // in order to cause the receiver to start emitting events for the property
  // path.
  this.def('on', function(event, handler, opts) {
    var path;

    if (observableEventRe.test(event)) {
      path = event.split(':')[1];

      if (!this.hasProperty(path) && path !== '*' &&
          !hasObserverFor.call(this, path)) {
        this.setupUnknownObserver(path, path, this);
      }
    }

    return this.supr(event, handler, opts);
  });

  // Internal: Overrides `Z.Emiter.off` to handler the teardown of property path
  // observers.
  this.def('off', function(event, handler, opts) {
    var path;

    this.supr(event, handler, opts);

    if (observableEventRe.test(event)) {
      path = event.split(':')[1];

      if (!this.hasProperty(path) && path !== '*' &&
          !hasObserverFor.call(this, path)) {
        this.teardownUnknownObserver(path, path, this);
      }
    }

    return this;
  });

  // Internal: Handler for `willChange:` events to a segment of a property path
  // being observed. Tears down internal path observers from the current value
  // just before it is actually removed from the path and emits a `willChange:`
  // event on the original path observer.
  function pathSegmentWillChange(event, data, ctx) {
    var val;

    if (ctx.tail && (val = this.get(ctx.head))) {
      val.teardownUnknownObserver(ctx.tail, ctx.path, ctx.observee);
    }

    ctx.observee.emit('willChange:' + ctx.path, data);
  }

  // Internal: Handler for `didChange:` events to a segment of a property path
  // being observed. Sets up internal path observers on the new value and emits
  // a `didChange:` event on the original path observer.
  function pathSegmentDidChange(event, data, ctx) {
    var val;

    if (ctx.tail && (val = this.get(ctx.head))) {
      val.setupUnknownObserver(ctx.tail, ctx.path, ctx.observee);
    }

    ctx.observee.emit('didChange:' + ctx.path, data);
  }

  // Internal: Called by `on` when a handler is registered for a `willChange:`
  // or `didChange:` event on an unknown property name. The unknown property is
  // assumed to be a property path and this method sets up internal observers
  // on each segment in the path in order to be able to emit events when any
  // segment in the path changes.
  //
  // rpath    - The relative path to the receiver. The method is called
  //            recursively on each segment within the path and each time the
  //            head of the path is popped off before the recursive call is
  //            made.
  // opath    - The original path to observe.
  // observee - The object the path is being observed on.
  this.def('setupUnknownObserver', function(rpath, opath, observee) {
    var i      = rpath.indexOf('.'),
        head   = i > 0 ? rpath.substring(0, i) : rpath,
        tail   = i > 0 ? rpath.substring(i + 1) : null,
        ctxkey = opath + ',' + observee.objectId,
        ctx    = {observee: observee, path: opath, head: head, tail: tail},
        val;

    if (head === '*' && tail) {
      throw new Error(Z.fmt("Z.Observable.on: observing `*` anywhere other than at the end of a key path is not supported: '%@'", opath));
    }

    if (!tail && !this.hasProperty(head) && head !== '*') {
      throw new Error(Z.fmt("Z.Observable.on: undefined key `%@` for %@", head, this));
    }

    this.on('willChange:' + head, pathSegmentWillChange, {context: ctx});
    this.on('didChange:' + head, pathSegmentDidChange, {context: ctx});
    (this.__z_contexts__ = this.__z_contexts__ || {})[ctxkey] = ctx;

    if (tail && (val = this.get(head))) {
      val.setupUnknownObserver(tail, opath, observee);
    }

    return this;
  });

  // Internal: Tears down internal observers setup by `setupUnknownObserver`.
  this.def('teardownUnknownObserver', function(rpath, opath, observee) {
    var i      = rpath.indexOf('.'),
        head   = i > 0 ? rpath.substring(0, i) : rpath,
        tail   = i > 0 ? rpath.substring(i + 1) : null,
        ctxkey = opath + ',' + observee.objectId,
        ctx    = this.__z_contexts__ ? this.__z_contexts__[ctxkey] : null,
        val;

    if (!tail && !this.hasProperty(head) && head !== '*') {
      throw new Error(Z.fmt("Z.Observable.off: undefined key `%@` for %@", head, this));
    }

    if (!ctx) { return this; }

    this.off('willChange:' + head, pathSegmentWillChange, {context: ctx});
    this.off('didChange:' + head, pathSegmentDidChange, {context: ctx});
    delete this.__z_contexts__[ctxkey];

    if (tail && (val = this.get(head))) {
      val.teardownUnknownObserver(tail, opath, observee);
    }

    return this;
  });

  // Public: This method is invoked by the KVC system when an attempt is made to
  // get an unknown property name. The default implementation of this method
  // attempts to find a raw property with the given name and returns one of the
  // following:
  //
  // * `null` if there is no property with the given name
  // * the raw property value if it is not a function
  // * the result of calling the function if the raw property is a function
  //   object
  //
  // k - The name of the unknown property.
  this.def('getUnknownProperty', function(k) {
    if (!(k in this)) { return null; }
    return typeof this[k] === 'function' ? this[k]() : this[k];
  });

  // Public: This method is invoked by the KVC system when an attempt is make to
  // set an unknown property name. The default implementation of this method
  // sets a raw property of the given name or if the raw property points to a
  // function object, then the function is called with the given value.
  //
  // k - The name of the unknown property.
  // v - The value being set.
  //
  // Returns `null`.
  this.def('setUnknownProperty', function(k, v) {
    if (typeof this[k] === 'function') { this[k](v); } else { this[k] = v; }
    return null;
  });
});
