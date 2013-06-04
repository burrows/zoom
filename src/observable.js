// `Z.Observable` is a module that implements the core of the Zoom key-value
// coding (KVC) and key-value observing (KVO) system.
//
// The KVC/KVO implementation is highly influenced by Cocoa:
//
// * [Key-Value Coding Programming Guide](http://developer.apple.com/library/mac/#documentation/cocoa/conceptual/KeyValueCoding/Articles/KeyValueCoding.html)
// * [Key-Value Observing Programming Guide](http://developer.apple.com/library/mac/#documentation/cocoa/conceptual/KeyValueObserving/KeyValueObserving.html)
Z.Observable = Z.Module.extend(function() {
  var slice = Array.prototype.slice,

  // A hash containing the default values for properties defined using
  // `Z.Observable.prop`.
  defaultPropertyOpts = {
    dependsOn : [],
    auto      : true,
    get       : null,
    set       : null,
    readonly  : false,
    def       : null,
    cache     : false
  };

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
  // If the property has automatic notifications turned on (the default) then
  // observers are also notified by invoking the `willChangeProperty` and
  // `didChangeProperty` methods.
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

    if (prop.auto) { this.willChangeProperty(k); }

    if (prop.set) {
      prop.set.call(this, v);
    }
    else {
      this['__' + k + '__'] = v;
    }

    if (prop.auto) { this.didChangeProperty(k); }

    return v;
  }

  // Internal: Observer function that gets invoked when a dependent property
  // path changes. Notifies observers of changes to the dependent property.
  //
  // notification - A notification object sent by the observer system.
  //
  // Returns nothing.
  function dependentPropertyObserver(notification) {
    if (notification.isPrior) {
      this.willChangeProperty(notification.context);
    }
    else {
      this.didChangeProperty(notification.context);
    }
  }

  // Internal: Registers observers for all properties defined with the
  // `dependsOn` option.
  //
  // Returns nothing.
  function registerDependsOnObservers() {
    var descs = this.propertyDescriptors(), desc, k, i, len;

    for (k in descs) {
      desc = descs[k];
      for (i = 0, len = desc.dependsOn.length; i < len; i++) {
        this.observe(desc.dependsOn[i], this, dependentPropertyObserver, {
          prior: true,
          context: k
        });
      }
    }
  }

  // Internal: Deregisters observers for all properties defined with the
  // `dependsOn` option.
  //
  // Returns nothing.
  function deregisterDependsOnObservers() {
    var descs = this.propertyDescriptors(), desc, k, i, len;

    for (k in descs) {
      desc = descs[k];
      for (i = 0, len = desc.dependsOn.length; i < len; i++) {
        this.stopObserving(desc.dependsOn[i], this, dependentPropertyObserver, {
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
    registerDependsOnObservers.call(this);
    return this.supr();
  });

  this.def('destroy', function() {
    deregisterDependsOnObservers.call(this);
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
  //               set. If set to `false`, you should use the
  //               `willChangeProperty` and `didChangeProperty` methods when
  //               your setter actually changes the property. Setting this to
  //               `false` only make sense when you have defined a custom setter
  //               using the `set` option.
  //   get       - By default, when properties are retrieved via `get` or the
  //               generated accessor method the actual value is read from a raw
  //               property with the name `__<name>__`. You can use this option
  //               to override that behavior by setting it to a function that
  //               calculates the property value. Be sure to specify the
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
  //               be cleared when any dependent paths change.
  //
  // Returns nothing.
  this.def('prop', function(name, opts) {
    opts = Z.merge({}, defaultPropertyOpts, opts);

    this['__z_property_' + name + '__'] = opts;

    if (name.match(/^[\w$]+/)) {
      this.def(name, function(v) {
        if (arguments.length === 0) {
          return getProperty.call(this, name);
        }
        else {
          return setProperty.call(this, name, v);
        }
      });
    }

    return null;
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
  // This is useful for cases where its important to avoid sending notifications
  // unless a value has actually changed.
  //
  // path  - A string containing a key path.
  // value - The value to set the key path to.
  //
  // Returns `value`.
  this.def('setif', function(path, value) {
    if (!Z.eq(this.get(path), value)) { this.set(path, value); }
    return value;
  });

  // Public: Registers an observer on the given path. Whenever some segment in
  // the path changes, the observer is notified by invoking the given action
  // with a notification object passed as an argument. The notification object
  // will contain the type of change that occured (usually `'change'`, but
  // container objects support other types of notifications), the object being
  // observed, and the path being observed.
  //
  // If you wish to be notified when any property on an object changes, the
  // special key `'*'` may be observed. This will cause notifications to be sent
  // to the observer when any property on the object changes.
  //
  // path     - A string containing the path to observe.
  // observer - The object to be notified when the path changes. This may be
  //            `null` if the action given in the third argument is a function.
  // action   - Either a string containing the name of a method to invoke on the
  //            observer or a function. If given a string and `observer` is set,
  //            the function will be invoked in the context of the observer.
  // opts     - A native object containing zero or more of the following:
  //   fire     - Fires off a notification immediately before returning.
  //              This may be useful in some cases where you want to trigger
  //              an observer during object initialization and then every
  //              time some path changes.
  //   previous - When set, the previous value of the key path is sent along in
  //              the notification as the `previous` key.
  //   current  - When set, the current value of the key path is sent along in
  //              the notification as the `current` key.
  //   once     - When set, the observer will automatically be removed the after
  //              the first time it fires.
  //   context  - An arbitrary object that will be sent along in notifications.
  //
  // Examples
  //
  //   var p = App.Person.create();
  //
  //   p.def('firstDidChange', function(n) { Z.log(n); });
  //   p.observe('first', p, 'firstDidChange', {previous: true, current: true});
  //   p.set('first', 'Bob');
  //
  //   // => {type: 'change', path: 'first', observee: #<App.Person:18 first: 'Bob', last: null>, previous: null, current: 'Bob'}
  //
  // Returns the receiver.
  this.def('observe', function(path, observer, action, opts) {
    var fire, registration, notification;

    opts = opts ? Z.dup(opts) : {};
    fire = Z.del(opts, 'fire');

    registration = this.registerObserver(path.split('.'), path, this, observer,
                                         action, opts);

    if (fire) {
      notification = { type: 'change', path: path, observee: this };
      if (registration.opts.current) {
        notification.current = this.get(path);
      }
      if (registration.opts.context) {
        notification.context = registration.opts.context;
      }

      registration.callback.call(registration.observer, notification);
    }

    return this;
  });

  // Public: Removes a previously registered observer. Subsequent changes to the
  // observed key path will no longer trigger notifications on the particular
  // observer indicated.
  //
  // path     - The key path to stop observing. This must be the exact same path
  //            passed to `observe`.
  // observer - The observer object passed to `observe`.
  // action   - The action passed to `observe.
  // opts     - If a `context` option was passed to `observe`, then the same
  //            object should be given here.
  //
  // Returns the receiver.
  this.def('stopObserving', function(path, observer, action, opts) {
    this.deregisterObserver(path.split('.'), path, this, observer, action, opts || {});
    return this;
  });

  // Internal: Does the actual bookkeeping for registering an observer. When a
  // path is being observed, this method takes care to attach observers at each
  // segment in the path.
  //
  // rpath    - The parsed path relative to the receiver. When paths are
  //            observed, the KVO system actually registers simple key observers
  //            at each segment of the path. This argument is the portion of the
  //            path relative to the receiver, which may be some object in the
  //            middle of the path.
  // opath    - The path originally passed to `observe`. This is the value sent
  //            as the `path` key in notification objects.
  // observee - The original object being observed. This is the receiver of the
  //            `observe` method.
  // observer - The observer originally passed to `observe`.
  // action   - The action originally passed to `observe`.
  // opts     - The options originally passed to `observe`.
  //
  // Returns the registration object created.
  // Throws `Error` if the first segment of `rpath` is an unknown property.
  this.def('registerObserver', function(rpath, opath, observee, observer, action, opts) {
    var head = rpath[0], tail = rpath.slice(1), registration, regs, val;

    if (!this.hasProperty(head) && head !== '*') {
      throw new Error(Z.fmt("Z.Object.registerObserver: undefined key `%@` for %@", head, this));
    }

    if (head === '*' && tail.length > 0) {
      throw new Error(Z.fmt("Z.Object.registerObserver: observing `*` in the middle of a property path is not supported: '%@'", opath));
    }

    registration = {
      path     : opath,
      head     : head,
      tail     : tail,
      observee : observee,
      observer : observer,
      action   : action,
      callback : typeof action === 'function' ? action : observer[action],
      opts     : opts,
      previous : {}
    };

    regs = (this.__z_registrations__ = this.__z_registrations__ || {});
    (regs[head] = regs[head] || []).push(registration);

    if (tail.length > 0 && (val = this.get(head))) {
      val.registerObserver(tail, opath, observee, observer, action, opts);
    }

    return registration;
  });

  // Internal: Does the actual bookkeeping for deregistering an observer. When a
  // path is being observed, this method takes care to deattach observers at
  // each segment in the path.
  //
  // rpath    - The parsed path relative to the receiver. When paths are
  //            observed, the KVO system actually registers simple key observers
  //            at each segment of the path. This argument is the portion of the
  //            path relative to the receiver, which may be some object in the
  //            middle of the path.
  // opath    - The path originally passed to `stopObserving`.
  // observee - The original object to stop observing. This is the receiver of
  //            the `stopObserving` method.
  // observer - The observer originally passed to `stopObserving`.
  // action   - The action originally passed to `stopObserving`.
  // opts     - The options originally passed to `stopObserving`.
  //
  // Returns nothing.
  // Throws `Error` if the first segment of `rpath` is an unknown property.
  this.def('deregisterObserver', function(rpath, opath, observee, observer, action, opts) {
    var head = rpath[0], tail = rpath.slice(1), registrations, i, r, val;

    if (!this.hasProperty(head) && head !== '*') {
      throw new Error(Z.fmt("Z.Object.deregisterObserver: undefined key `%@` for %@", head, this));
    }

    opts = opts || {};

    registrations = (this.__z_registrations__ || {})[head];
    if (!registrations) { return; }

    for (i = registrations.length - 1; i >= 0; i--) {
      r = registrations[i];

      if (r.path         === opath    &&
          r.observee     === observee &&
          r.observer     === observer &&
          r.action       === action   &&
          r.opts.context === opts.context) {
        registrations.splice(i, 1);

        if (tail.length > 0 && (val = this.get(head))) {
          val.deregisterObserver(tail, opath, observee, observer, action, opts);
        }
      }
    }
  });

  // Public: Notifies the receiver that one of its properties is about to
  // change. This method processes all observer registrations for the key being
  // changed and prepares notification objects to be sent after the property has
  // actually changed (see `didChangeProperty`). If any observer registrations
  // have the `prior` option set, then notifications are sent to those observers
  // immediately.
  //
  // Additionally, this method does the appropriate bookkeeping for path
  // observers. If some object is being removed from an observed path, then the
  // path observer is recursively removed starting from that object and any
  // other objects currently attached to it along the path.
  //
  // All properties defined with the `auto` option set (which is the default)
  // will automatically call this method and `didChangeProperty` when they
  // change. Properties defined with `auto` set to `false` will need to also
  // have a custom setter function (`set` option) that calls
  // `willChangeProperty` and `didChangeProperty`.
  //
  // k    - The name of the property that will change.
  // opts - A native object containing zero or more of the following.
  //   type     - A string containing the type of notification to send. The
  //              default is 'change'.
  //   previous - The value to send as the `previous` key in the notification.
  //              The KVO system will simply `get` the path being observed when
  //              observers are registered with the `previous` key, so this
  //              should only be used in special circumstances (see the `@`
  //              property of `Z.Array` and `Z.Hash` to see where its used.
  //   *        - Any other properties present in the options hash will be
  //              merged into the notification object that is sent to observers.
  //
  // Returns the receiver.
  this.def('willChangeProperty', function(k, opts) {
    var regs, star, type, i, len, r, val, notification, prevGiven, prev;

    if (!this.__z_registrations__) { return this; }

    regs = this.__z_registrations__[k];
    star = this.__z_registrations__['*'];

    if (star) { regs = regs ? regs.concat(star) : star; }

    if (!regs) { return this; }

    regs      = regs.slice();
    opts      = opts ? Z.dup(opts) : {};
    type      = Z.del(opts, 'type') || 'change';
    prevGiven = opts.hasOwnProperty('previous');
    prev      = Z.del(opts, 'previous');

    for (i = 0, len = regs.length; i < len; i++) {
      r = regs[i];

      if (r.opts.previous) {
        r.previous[type] = prevGiven ? prev : r.observee.get(r.path);
      }

      if (r.tail.length > 0 && (val = this.get(k))) {
        val.deregisterObserver(r.tail, r.path, r.observee, r.observer, r.action, r.opts);
      }

      if (r.opts.prior) {
        notification = {
          type     : type,
          isPrior  : true,
          path     : r.head === '*' ? r.path.replace('*', k) : r.path,
          observee : r.observee
        };

        if (r.opts.context) { notification.context = r.opts.context; }
        if (r.opts.previous) { notification.previous = r.previous[type]; }

        Z.merge(notification, opts);

        r.callback.call(r.observer, notification);
      }
    }

    return this;
  });

  // Public: Notifies the receiver that one of its properties has just changed.
  // This method processes all observer registrations for the key being changed
  // and sends the notification objects that were initially prepared by
  // `willChangeProperty`.
  //
  // Additionally, this method does the appropriate bookkeeping for path
  // observers. If some object is being added to an observed path, then the
  // path observer is recursively attached starting from that object and any
  // other objects currently attached to it along the path.
  //
  // k    - The name of the property that did change.
  // opts - A native object containing zero or more of the following.
  //   type    - A string containing the type of notification to send. The
  //             default is 'change'.
  //   current - The value to send as the `current` key in the notification. The
  //             KVO system will simply `get` the path being observed when
  //             observers are registered with the `current` key, so this should
  //             only be used in special circumstances (see the `@` property of
  //             `Z.Array` and `Z.Hash` to see where its used.
  //   *       - Any other properties present in the options hash will be merged
  //             into the notification object that is sent to observers.
  //
  // Returns the receiver.
  this.def('didChangeProperty', function(k, opts) {
    var cache = '__' + k + '_' + 'cached' + '__',
        regs, star, type, i, len, r, val, notification, curGiven, cur;

    delete this[cache];

    if (!this.__z_registrations__) { return this; }

    regs = this.__z_registrations__[k];
    star = this.__z_registrations__['*'];

    if (star) { regs = regs ? regs.concat(star) : star; }

    if (!regs) { return this; }

    regs     = regs.slice();
    opts     = opts ? Z.dup(opts) : {};
    type     = Z.del(opts, 'type') || 'change';
    curGiven = opts.hasOwnProperty('current');
    cur      = Z.del(opts, 'current');

    for (i = 0, len = regs.length; i < len; i++) {
      r = regs[i];

      notification = {
        type     : type,
        path     : r.head === '*' ? r.path.replace('*', k) : r.path,
        observee : r.observee
      };

      if (r.opts.previous) { notification.previous = Z.del(r.previous, type); }
      if (r.opts.context) { notification.context = r.opts.context; }

      if (r.opts.current) {
        notification.current = curGiven ? cur : r.observee.get(r.path);
      }

      Z.merge(notification, opts);

      if (r.tail.length > 0 && (val = this.get(k))) {
        val.registerObserver(r.tail, r.path, r.observee, r.observer, r.action,
                             r.opts);
      }

      r.callback.call(r.observer, notification);

      if (r.opts.once) {
        r.observee.stopObserving(r.path, r.observer, r.action, r.opts);
      }
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
