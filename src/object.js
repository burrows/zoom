(function(undefined) {

var objectId = 1, slice = Array.prototype.slice;

// `Z.Object` is the top level object of the Zoom object hierarchy. All other
// Zoom objects descend from it. It implements some basic object methods and
// properties as well as the core of the key-value coding (KVC) and key-value
// observing (KVO) system.
//
// The KVC/KVO implementation is highly influenced by Cocoa:
//
// * [Key-Value Coding Programming Guide](http://developer.apple.com/library/mac/#documentation/Cocoa/Conceptual/KeyValueCoding/Articles/KeyValueCoding.html)
// * [Key-Value Observing Programming Guide](http://developer.apple.com/library/mac/#documentation/Cocoa/Reference/Foundation/Protocols/NSKeyValueObserving_Protocol/Reference/Reference.html#//apple_ref/occ/cat/NSKeyValueObserving)
//
// Zoom uses a custom object system that leverages the prototypal nature of
// javascript. There are no classes in Zoom, only prototype objects and concrete
// instances of those prototypes. The prototype objects are often used in a
// manner similar to how class objects are used in other languages.
//
// Even though javascript supports prototypal inheritance at the language level,
// it still leaves a bit to be desired. The language provides no easy way to
// invoke super methods, nor a robust approach for mixing in properties from
// other objects. Zoom solves both of these problems by providing a `supr`
// method and a module system that allows you to mix modules in to your
// prototypes in a safe way (properties will never be clobbered).
//
// New prototype objects are created by invoking the `extend` method on
// `Z.Object` or some other prototype that descends from `Z.Object`. An optional
// function can be passed to `extend` that will be executed in the context of
// the new prototype object. This is the "prototype body", so to speak, where
// you can define methods and properties on your prototype.
//
// ```javascript
// App.Animal = Z.Object.extend(function() {
//   this.def('speak', function(s) {
//     return s;
//   });
// });
//
// a = App.Animal.create(); // => #<App.Animal:18>
// App.Animal.ancestors();  // => [App.Animal, Z.Object]
// a.speak('hello');        // => 'hello'
//
// App.Dog = App.Animal.extend(function() {
//   this.def('speak', function(s) {
//     return 'WOOF! ' + this.supr(s) + ' WOOF!';
//   });
// });
//
// d = App.Dog.create(); // => #<App.Dog:20>
// App.Dog.ancestors();  // => [App.Dog, App.Animal, Z.Object]
// d.speak('hello');     // => 'WOOF! hello WOOF!'
// ```
//
// Zoom also provides a module system that is similar to Ruby's. Modules are
// essentially just a container where you can define methods and properties that
// can be mixed in to prototype objects. Module are non-destructive, meaning
// that they will never clobber methods or properties defined in the prototype.
// Due to the fact that the ECMAScript standard does not define a way to modify
// an object's prototype, modules can only be mixed in to a prototype when the
// prototype is defined. You can mixin a module by simply passing it to the
// `extend` method.
//
// ```javascript
// App.Flyable = Z.Module.create(function() {
//   this.def('fly', function() { return 'flying'; });
// });
//
// App.Bird = App.Animal.extend(App.Flyable);
//
// App.Bird.ancestors();    // => [App.Bird, App.Flyable, App.Animal, Z.Object]
// App.Bird.create().fly(); // => 'flying'
// ```
Z.Object = { __z_objectId__: objectId++, isZObject: true, isPrototype: true };
Z.Object.open = function(f) { f.call(this); return this; };
Z.Object.open.__z_name__ = 'open';
Z.Object.def = function(name, f) {
  f.__z_name__ = name; this[name] = f;
  return this;
};
Z.Object.def.__z_name__ = 'def';

Z.Object.open(function() {
  // Private: A hash containing the default values for properties defined using
  // `Z.Object.property`.
  var defaultPropertyOpts = {
    dependsOn : [],
    auto      : true,
    get       : null,
    set       : null,
    readonly  : false,
    def       : null
  };

  function getProperty(k) {
    var desc = this[Z.fmt("__z_property_%@__", k)], prop = '__' + k + '__', v;

    if (!desc) { return this.getUnknownProperty(k); }

    v = desc.get ? desc.get.call(this) : this[prop];

    return v === undefined || v === null ? desc.def : v;
  }

  function setProperty(k, v) {
    var prop = this[Z.fmt("__z_property_%@__", k)];
    if (!prop) { return this.setUnknownProperty(k, v); }

    if (prop.readonly) {
      throw new Error(Z.fmt("Z.Object.set: attempted to set readonly property `%@` for %@", k, this));
    }

    if (prop.auto) { this.willChangeProperty(k); }

    if (prop.set) {
      prop.set.call(this, v);
    }
    else {
      this[Z.fmt("__%@__", k)] = v;
    }

    if (prop.auto) { this.didChangeProperty(k); }

    return null;
  }

  function dependentPropertyObserver(notification) {
    if (notification.isPrior) {
      this.willChangeProperty(notification.context);
    }
    else {
      this.didChangeProperty(notification.context);
    }
  }

  this.def('extend', function() {
    var args  = slice.call(arguments),
        f     = typeof args[args.length - 1] === 'function' ? args.pop() : null,
        proto = this,
        i, len, o;

    for (i = 0, len = args.length; i < len; i++) {
      proto = args[i].createMixin(proto);
    }

    o = Object.create(proto);

    o.isPrototype    = true;
    o.__z_objectId__ = objectId++;

    if (this.respondTo('extended')) { this.extended(o); }

    if (f) { f.call(o); }

    return o;
  });

  this.def('create', function() {
    var o = this.extend();

    o.isPrototype = false;

    if (typeof o.initialize === 'function') {
      o.initialize.apply(o, slice.call(arguments));
    }

    return o;
  });

  this.def('prototype', function() {
    var p;

    if (this.isPrototype) {
      throw new Error('Z.Object.prototype: must be called on a concrete object');
    }

    p = Object.getPrototypeOf(this);

    while (p && !p.isPrototype) { p = Object.getPrototypeOf(p); }

    return p;
  });

  this.def('supr', function () {
    var caller = arguments.callee.caller,
        name   = caller.__z_name__,
        o      = this,
        args   = slice.call(arguments),
        method;

    if (!name || !o[name]) {
      throw new Error(Z.fmt('Z.Object.supr: must be called from within a method: %@', this));
    }

    while (o) {
      if (o.hasOwnProperty(name) && o[name] === caller) { break; }
      o = Object.getPrototypeOf(o);
    }

    if (!(method = Object.getPrototypeOf(o)[name])) {
      throw new Error(Z.fmt('Z.Object.supr: no super method `%@` found for %@', name, this));
    }

    return method.apply(this, args);
  });

  this.def('respondTo', function(name) {
    return typeof this[name] === 'function';
  });

  this.def('ancestors', function() {
    var p = this, a = [this];

    while ((p = Object.getPrototypeOf(p)) !== Object.prototype) {
      a.push(p.hasOwnProperty('__z_module__') ? p.__z_module__ : p);
    }

    return a;
  });

  this.def('isA', function(o) {
    return this.ancestors().indexOf(o) !== -1;
  });

  this.def('prototypeName', function() {
    var o          = this.isPrototype ? this : this.prototype(),
        namespaces = Z.namespaces(),
        namespace, i, len, k;

    for (i = 0, len = namespaces.length; i < len; i++) {
      namespace = namespaces[i];

      for (k in namespace[0]) {
        if (namespace[0].hasOwnProperty(k) && namespace[0][k] === o) {
          return namespace[1].length > 0 ? Z.fmt("%@.%@", namespace[1], k) : k;
        }
      }
    }

    return '(Unknown)';
  });

  this.def('toString', function() {
    var self = this, prototype, descriptors, props, recursed, a;

    if (this.isPrototype) { return this.prototypeName(); }

    prototype   = this.prototype();
    descriptors = this.propertyDescriptors();
    a           = [];

    recursed = Z.detectRecursion(this, function() {
      var k;

      for (k in descriptors) {
        if (descriptors[k].get !== null) { continue; }
        a.push(k + ': ' + Z.inspect(self.get(k)));
      }
    });

    return Z.fmt("#<%@:%@%@>", prototype.prototypeName(), this.objectId(),
                 recursed ? ' ...' : (a.length > 0 ? ' ' : '') + a.join(', '));
  });


  // Defines a property on the prototype. In order to use Zoom's KVC and KVO
  // systems, you must this method to define your properties.
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
  // Consider the following example:
  //
  // ```javascript
  // App.Person = Z.Object.extend(function() {
  //   this.property('first');
  //   this.property('last');
  //   this.property('full', {
  //     get: function() { return this.first() + ' ' + this.last(); },
  //     set: function(name) {
  //       var names = name.split(' ');
  //       this.first(names[0]);
  //       this.last(names[1]);
  //     }
  //   });
  // });
  // ```
  //
  // New `Person` objects can be created by using the `create` method, passing
  // in any properties you wish to set:
  //
  // ```javascript
  // p = App.Person.create({first: 'Michael', last: 'Jordan'});
  // ```
  //
  // You can then use the generated accessor methods or `get` and `set` to
  // modify the properties:
  //
  // ```javascript
  // p.first()      // => 'Michael'
  // p.get('first') // => 'Michael'
  // p.last()       // => 'Jordan'
  // p.get('last')  // => 'Jordan'
  // p.full()       // => 'Michael Jordan'
  // p.get('full')  // => 'Michael Jordan'
  // p.toString()   // => '#<App.Person:18 first: 'Michael', last: 'Jordan'>'
  //
  // p.first('Scottie')
  // p.set('last', 'Pippen')
  // p.toString()   // => '#<App.Person:18 first: 'Scottie', last: 'Pippen'>'
  //
  // p.full('Dennis Rodman')
  // p.toString()   // => '#<App.Person:18 first: 'Dennis', last: 'Rodman'>'
  // ```
  //
  // * `name` - A string containing the name of the property.
  // * `opts` - A native js object containing one or more of the following:
  //   * `dependsOn` - Pass a list of keys or key paths that the property depends
  //                   on. This should be used for computed properties to allow
  //                   them to be observed.
  //   * `auto`      - The key-value observing system will automatically notifiy
  //                   observers of the property when it changes when this option
  //                   is set. If set to `false`, you should use the
  //                   `propertyWillChange` and `propertyDidChange` methods when
  //                   your setter actually changes the property. Setting this to
  //                   `false` only make sense when you have defined a custom
  //                   setter using the `set` option.
  //   * `get`       - By default, when properties are retrieved via `get` or
  //                   the generated accessor method the actual value is read
  //                   from a raw property with the name `__<name>__`. You can
  //                   use this option to override that behavior by setting it
  //                   to a function that calculates the property value. Be sure
  //                   to specify the dependant properties with the `dependsOn`
  //                   option.
  //   * `set`       - By default, when properties are set via `set` or the
  //                   generated accessor method the value is stored on a raw
  //                   property with the name `__<name>__`. You can use this
  //                   option to override that behavior by setting it to a
  //                   function that stores the given value.
  //   * `readonly`  - Prevents setting of the property. Any attempts to set the
  //                   property will throw an exception.
  //   * `def`       - Specify a default value for the property.
  //
  // Returns nothing.
  this.def('property', function(name, opts) {
    opts = Z.defaults(opts || {}, defaultPropertyOpts);

    this[Z.fmt("__z_property_%@__", name)] = opts;

    if (name.match(/^[\w$]+/)) {
      this.def(name, function(v) {
        if (arguments.length === 0) {
          return getProperty.call(this, name);
        }
        else {
          return setProperty.call(this, name, arguments[0]);
        }
      });
    }

    return null;
  });

  this.def('propertyDescriptors', function() {
    var props = {}, k, match;

    for (k in this) {
      if ((match = k.match(/^__z_property_(.*)__$/))) {
        props[match[1]] = this[k];
      }
    }

    return props;
  });

  this.def('hasProperty', function(name) {
    return typeof this[Z.fmt("__z_property_%@__", name)] === 'object';
  });

  this.def('initialize', function(properties) {
    var descriptors = this.propertyDescriptors(), k, descriptor, path, i, len;

    this.set(properties || {});

    for (k in descriptors) {
      descriptor = descriptors[k];
      for (i = 0, len = descriptor.dependsOn.length; i < len; i++) {
        this.observe(descriptor.dependsOn[i], this, dependentPropertyObserver, {
          prior: true, context: k
        });
      }
    }

    return this;
  });

  this.property('objectId', {
    readonly: true,
    get: function() { return this.__z_objectId__; }
  });

  this.def('hash', function() {
    return Z.murmur(this.objectId().toString(), Z.hashSeed());
  });

  this.def('eq', function(o) { return this === o; });
  this.def('neq', function(o) { return !this.eq(o); });

  this.def('get', function() {
    var paths, path, i, len, result;

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
        path = paths[i];
        result[path] = this._get(path.split('.'));
      }
    }
    else {
      result = this._get(paths[0].split('.'));
    }

    return result;
  });

  this.def('_get', function(path) {
    var head = path[0], tail = slice.call(path, 1), v = getProperty.call(this, head);

    if (tail.length > 0) { return v ? v._get(tail) : null; }
    else { return v; }
  });

  this.def('set', function(path, value) {
    var k, o, init, last;

    if (arguments.length === 1) {
      for (k in path) {
        if (path.hasOwnProperty(k)) {
          this.set(k, path[k]);
        }
      }

      return null;
    }

    path = path.split('.');
    init = path.slice(0, path.length - 1);
    last = path[path.length - 1];

    if (init.length > 0) {
      if ((o = this._get(init))) { setProperty.call(o, last, value); }
    }
    else {
      setProperty.call(this, last, value);
    }

    return null;
  });

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
        notification.context = registration.context;
      }

      registration.callback.call(registration.observer, notification);
    }

    return this;
  });

  this.def('stopObserving', function(path, observer, action, opts) {
    this.deregisterObserver(path.split('.'), path, this, observer, action, opts || {});
    return this;
  });

  this.def('registerObserver', function(rpath, opath, observee, observer, action, opts) {
    var head = rpath[0], tail = rpath.slice(1), registration, regs, val;

    if (!this.hasProperty(head)) {
      throw new Error(Z.fmt("Z.Object.registerObserver: undefined key `%@` for %@", head, this));
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

  this.def('deregisterObserver', function(rpath, opath, observee, observer, action, opts) {
    var head = rpath[0], tail = rpath.slice(1), registrations, i, r, val;

    if (!this.hasProperty(head)) {
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

  this.def('willChangeProperty', function(k, opts) {
    var registrations = (this.__z_registrations__ || {})[k],
        type, i, len, r, val, notification;

    if (!registrations) { return; }

    opts = opts ? Z.dup(opts) : {};
    type = Z.del(opts, 'type') || 'change';

    for (i = 0, len = registrations.length; i < len; i++) {
      r = registrations[i];

      if (r.opts.previous) {
        if (opts.hasOwnProperty('previous')) {
          r.previous[type] = opts.previous;
        }
        else {
          r.previous[type] = r.observee.get(r.path);
        }
      }

      if (r.tail.length > 0 && (val = this.get(k))) {
        val.deregisterObserver(r.tail, r.path, r.observee, r.observer, r.action, r.opts);
      }

      if (r.opts.prior) {
        notification = {
          type     : type,
          isPrior  : true,
          path     : r.path,
          observee : r.observee
        };

        if (r.opts.context) { notification.context = r.opts.context; }
        if (r.opts.previous) { notification.previous = r.previous[type]; }

        Z.del(opts, 'previous');
        Z.merge(notification, opts);

        r.callback.call(r.observer, notification);
      }
    }

    return this;
  });

  this.def('didChangeProperty', function(k, opts) {
    var registrations = (this.__z_registrations__ || {})[k],
        type, i, len, r, val, notification;

    if (!registrations) { return; }

    opts = opts ? Z.dup(opts) : {};
    type = Z.del(opts, 'type') || 'change';

    for (i = 0, len = registrations.length; i < len; i++) {
      r = registrations[i];

      notification = { type: type, path: r.path, observee: r.observee };

      if (r.opts.previous) { notification.previous = Z.del(r.previous, type); }
      if (r.opts.context) { notification.context = r.opts.context; }

      if (r.opts.current) {
        if (opts.hasOwnProperty('current')) {
          notification.current = opts.current;
        }
        else {
          notification.current = r.observee.get(r.path);
        }
      }

      Z.del(opts, 'current');
      Z.merge(notification, opts);

      if (r.tail.length > 0 && (val = this.get(k))) {
        val.registerObserver(r.tail, r.path, r.observee, r.observer, r.action,
                             r.opts);
      }

      r.callback.call(r.observer, notification);
    }

    return this;
  });

  this.def('getUnknownProperty', function(k) {
    throw new Error(Z.fmt("Z.Object.get: undefined key `%@` for %@", k, this));
  });

  this.def('setUnknownProperty', function(k) {
    throw new Error(Z.fmt("Z.Object.set: undefined key `%@` for %@", k, this));
  });
});

}());

