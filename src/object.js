(function(undefined) {

var objectId = 1, slice = Array.prototype.slice;

// `Z.Object` is the top level object of the Zoom object hierarchy. All other
// Zoom objects descend from it. It implements some basic object methods and
// properties as well as the core of the key-value coding (KVC) and key-value
// observing (KVO) system.
//
// The KVC/KVO implementation is highly influenced by Cocoa:
//
// * [Key-Value Coding Programming Guide](http://developer.apple.com/library/mac/#documentation/cocoa/conceptual/KeyValueCoding/Articles/KeyValueCoding.html)
// * [Key-Value Observing Programming Guide](http://developer.apple.com/library/mac/#documentation/cocoa/conceptual/KeyValueObserving/KeyValueObserving.html)
//
// Zoom uses a custom object system that leverages the prototypal nature of
// javascript. There are no classes in Zoom, only type objects and concrete
// instances of those types. The type objects are often used in a manner similar
// to how class objects are used in other languages, however its important to
// note that they are not classes, they are Zoom objects like any other. This
// means that they respond to all methods defined on `Z.Object`. The main
// difference between type objects and concrete instances is that type objects
// are created by `Z.Object.extend` and concrete instances are created by
// `Z.Object.create` and have their `init` method invoked if present.
//
// Even though javascript supports prototypal inheritance at the language level,
// it still leaves a bit to be desired. The language provides no easy way to
// invoke super methods, nor a robust approach for mixing in properties from
// other objects. Zoom solves both of these problems by providing a `supr`
// method and a module system that allows you to mix modules in to your types in
// a safe way (properties will never be clobbered).
//
// New type objects are created by invoking the `extend` method on `Z.Object` or
// some other type that descends from `Z.Object`. An optional function can be
// passed to `extend` that will be executed in the context of the new type
// object. This is the "type body", so to speak, where you can define methods
// and properties on your type. The "type body" is optional, methods and
// properties can be defined by calling `def` or `property` directly on the
// type object.
//
// Zoom also provides a module system that is similar to Ruby's. Modules are
// essentially just a container where you can define methods and properties that
// can be mixed in to type objects. Module are non-destructive, meaning that
// they will never clobber methods or properties defined on the type. Due to the
// fact that the ECMAScript standard does not define a way to modify an object's
// prototype, modules can only be mixed in to a type when the type is defined.
// You can mixin a module by simply passing it to the `extend` method.
//
// Examples
//
//   App.Animal = Z.Object.extend(function() {
//     this.def('speak', function(s) {
//       return s;
//     });
//   });
//
//   a = App.Animal.create(); // => #<App.Animal:18>
//   App.Animal.ancestors();  // => [App.Animal, Z.Object]
//   a.speak('hello');        // => 'hello'
//
//   App.Dog = App.Animal.extend(function() {
//     this.def('speak', function(s) {
//       return 'WOOF! ' + this.supr(s) + ' WOOF!';
//     });
//   });
//
//   d = App.Dog.create(); // => #<App.Dog:20>
//   App.Dog.ancestors();  // => [App.Dog, App.Animal, Z.Object]
//   d.speak('hello');     // => 'WOOF! hello WOOF!'
//
//   App.Flyable = Z.Module.create(function() {
//     this.def('fly', function() { return 'flying'; });
//   });
//
//   App.Bird = App.Animal.extend(App.Flyable); // no type body
//
//   App.Bird.ancestors();    // => [App.Bird, App.Flyable, App.Animal, Z.Object]
//   App.Bird.create().fly(); // => 'flying'
Z.Object = { __z_objectId__: objectId++, isZObject: true, isType: true };

// Public: Opens a zoom object for modification. It simply executes the given
// function in the context of the receiver.
//
// f - A function to execute. `this` will point to the receiver in the body of
//     the function.
//
// Returns the receiver.
Z.Object.open = function(f) { f.call(this); return this; };
Z.Object.open.__z_name__ = 'open';

// Public: Defines a method on the receiver.
//
// name - A string representing the name of the method.
// f    - A function containing the body of the method.
//
// Returns the receiver.
Z.Object.def = function(name, f) {
  f.__z_name__ = name; this[name] = f;
  return this;
};
Z.Object.def.__z_name__ = 'def';

Z.Object.open(function() {
  // A hash containing the default values for properties defined using
  // `Z.Object.property`.
  var defaultPropertyOpts = {
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
  // Returns `null`.
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

    return null;
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
  function setupDependsOnObservers() {
    var descs = this.propertyDescriptors(), desc, k, path, i, len;

    for (k in descs) {
      desc = descs[k];
      for (i = 0, len = desc.dependsOn.length; i < len; i++) {
        this.observe(desc.dependsOn[i], this, dependentPropertyObserver, {
          prior: true, context: k
        });
      }
    }
  }

  // Public: Extends the receiver by creating a new type object with the
  // receiver set as the new type object's prototype. This is typically called
  // on type objects to further extend their behavior. If the receiver responds
  // to the `extended` method, that method will be invoked with the newly
  // created object passed as an argument.
  //
  // References to `Z.Module` objects may be passed to mix them in to the new
  // objects prototype chain. Note that `extend` is the only way to mix in a
  // module, it is not allowed after the object has been created (this is due to
  // the fact that the ECMAScript standard does not define a way to modify an
  // object's prototype after its been created).
  //
  // *mods - Zero or more `Z.Module` objects to mix in to the prototype chain.
  // f     - A function to execute in the context of the new object (default:
  //         `null`).
  //
  // Examples
  //
  //   Person = Z.Object.extend(function() {
  //     this.prop('first');
  //     this.prop('last');
  //   });
  //
  // Returns the new object.
  this.def('extend', function() {
    var args  = slice.call(arguments),
        f     = typeof args[args.length - 1] === 'function' ? args.pop() : null,
        proto = this,
        i, len, o;

    for (i = 0, len = args.length; i < len; i++) {
      proto = args[i].createMixin(proto);
    }

    o = Z.create(proto);

    o.isType         = true;
    o.__z_objectId__ = objectId++;

    if (this.respondTo('extended')) { this.extended(o); }

    if (f) { f.call(o); }

    return o;
  });

  // Public: Creates a "concrete instance" of the receiver and invokes the
  // `init` method. A concrete instance is simply an object created from a type
  // object or another concrete instance using the `create` method.
  //
  // *args - An arbitrary list of arguments, they are forwarded on to the `init`
  //         method. `Z.Object.init` expects a native object containing
  //         key/value pairs of properties to set.
  //
  // Returns the newly created and initialized object.
  this.def('create', function() {
    var o = this.extend();

    o.isType = false;

    if (o.respondTo('init')) {
      o.init.apply(o, slice.call(arguments));
    }

    setupDependsOnObservers.call(o);

    return o;
  });

  // Public: Returns the type of a concrete object. This is not necessarily the
  // object's prototype (`__proto__` in some javascript runtimes), but the first
  // object in the prototype chain that was created with `Z.Object.extend`
  // (otherwise known as a type object).
  //
  // Returns the type object of the receiver.
  // Throws `Error` if called on a type object.
  this.def('type', function() {
    var p;

    if (this.isType) {
      throw new Error('Z.Object.type: must be called on a concrete object');
    }

    p = Z.getPrototypeOf(this);

    while (p && !p.isType) { p = Z.getPrototypeOf(p); }

    return p;
  });

  // Public: Invokes a super method. The super method is found by searching up
  // the prototype chain starting from the object that holds the currently
  // executing function. From there each prototype object is traversed until a
  // method with the same name as the currently executing method is found.
  //
  // Arguments passed to the currently executing function are not automatically
  // forwarded on to the super method as they are in other languages.
  //
  // NOTE: This method uses `arguments.callee` which is deprecated. A better
  // approach would be to use a named function expression instead, but that
  // causes issues in IE.
  //
  // Returns the return value of the super method.
  // Throws `Error` when called from outside of a method body.
  // Throws `Error` when a super method cannot be found.
  this.def('supr', function() {
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
      o = Z.getPrototypeOf(o);
    }

    if (!(method = Z.getPrototypeOf(o)[name])) {
      throw new Error(Z.fmt('Z.Object.supr: no super method `%@` found for %@', name, this));
    }

    return method.apply(this, args);
  });

  // Public: Returns `true` if the receiver responds to a method of the given
  // name and `false` otherwise.
  //
  // name - The name of the method to check for.
  this.def('respondTo', function(name) {
    return typeof this[name] === 'function';
  });

  // Public: Returns a native array containing all ancestor objects of the
  // receiver. An object's ancestors includes itself as well as all objects
  // along its prototype chain, including modules that were mixed in.
  //
  // Examples
  //
  //   Z.Array.ancestors() // # => [Z.Array, Z.Orderable, Z.Enumerable, Z.Object]
  //
  // Returns a native array.
  this.def('ancestors', function() {
    var p = this, a = [this];

    while ((p = Z.getPrototypeOf(p)) !== Object.prototype) {
      a.push(p.hasOwnProperty('__z_module__') ? p.__z_module__ : p);
    }

    return a;
  });

  // Public: Returns `true` if the given object exists in the receiver's
  // prototype chain and `false` otherwise.
  //
  // o - Any object.
  this.def('isA', function(o) {
    var ancestors = this.ancestors(), i, len;

    for (i = 0, len = ancestors.length; i < len; i++) {
      if (ancestors[i] === o) { return true; }
    }

    return false;
  });

  // Public: Returns the name of a type object. When invoked on a concrete
  // instance, the name of the object's type (as determined by the
  // `Z.Object.type` method) is returned.
  //
  // A type's name is found by introspecting all of the registered namespaces
  // known to Zoom (using `Z.addNamespace`), looking for a property that is
  // identical to the receiver. Type objects that are not attached to a
  // registered namespace will return the string `'(Unknown)'`.
  //
  // Returns a string containing the name of the type.
  this.def('typeName', function() {
    var o          = this.isType ? this : this.type(),
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

  // Public: Specifies the properties to display by the `toString` method.
  // Sub-types can override this method to specify additional properties to
  // display.
  //
  // Returns a native array.
  this.def('toStringProperties', function() { return []; });

  // Public: Generates a string representation of the object. When called on a
  // type object, this method simply delegates to the `Z.Object.typeName`
  // method, otherwise it generates a string containing the name of the object's
  // type, its object id, and any properties defined on the object.
  //
  // Returns a string.
  this.def('toString', function() {
    var self = this, type, props, recursed, a;

    if (this.isType) { return this.typeName(); }

    type  = this.type();
    props = this.toStringProperties();
    a     = [];

    recursed = Z.detectRecursion(this, function() {
      var i, len;

      for (i = 0, len = props.length; i < len; i++) {
        a.push(props[i] + ': ' + Z.inspect(self.get(props[i])));
      }
    });

    return Z.fmt("#<%@:%@%@>", type.typeName(), this.objectId(),
                 recursed ? ' ...' : (a.length > 0 ? ' ' : '') + a.join(', '));
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
  //               be cleared when any dependant paths change.
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
          return setProperty.call(this, name, arguments[0]);
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

  // Public: The default `Z.Object` initializer. Takes a native object mapping
  // property names to values and sets each on the object.
  //
  // props - A native object containing property/value pairs (default: null).
  //
  // Returns the receiver.
  this.def('init', function(props) {
    if (props) { this.set(props); }
    return this;
  });

  // Public: Returns the reciever's object id. All Zoom objects are assigned a
  // unique id when they are created.
  this.prop('objectId', {
    readonly: true,
    get: function() { return this.__z_objectId__; }
  });

  // Public: Returns a hash value for the receiver. This method is used by the
  // `Z.Hash` type to generate hash codes for objects used as keys. The default
  // implementation uses the object's id to generate a hash code. You'll likely
  // want to override this in the sub-types if you want to use them as hash
  // keys.
  //
  // Returns a number.
  this.def('hash', function() { return Z.hash(this.__z_objectId__); });

  // Public: Indicates whether the receiver is equal to the given object. The
  // default implementation simply does an identity comparison using the `===`
  // operator. You'll likely want to override this method in your sub-types in
  // order to perform a more meaningful comparison.
  //
  // o - An object to compare against the receiver.
  //
  // Returns a `true` if the objects are equal and `false` otherwise.
  this.def('eq', function(o) { return this === o; });

  // Public: Indicates whether the receiver is not equal to the given object.
  //
  // o - An object to compare against the receiver.
  //
  // Returns a `true` if the objects are not equal and `false` otherwise.
  this.def('neq', function(o) { return !this.eq(o); });

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
        result[path] = this.getParsedPath(path.split('.'));
      }
    }
    else {
      result = this.getParsedPath(paths[0].split('.'));
    }

    return result;
  });

  // Internal: Returns the value of the property at the end of the given parsed
  // path. A parsed path is simply an array containing string representing each
  // segment of the path.
  //
  // path - An array containing strings for each segment in the path.
  //
  // Returns the value of the property at the end of the path.
  this.def('getParsedPath', function(path) {
    var head = path[0], tail = slice.call(path, 1), v = getProperty.call(this, head);

    if (tail.length > 0) { return v ? v.getParsedPath(tail) : null; }
    else { return v; }
  });

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
  // Returns `null`.
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
      if ((o = this.getParsedPath(init))) { setProperty.call(o, last, value); }
    }
    else {
      setProperty.call(this, last, value);
    }

    return null;
  });

  // Public: Registers an observer on the given path. Whenever some segment in
  // the path changes, the observer is notified by invoking the given action
  // with a notification object passed as an argument. The notification object
  // will contain the type of change that occured (usually `'change'`, but
  // container objects support other types of notifications), the object being
  // observed, and the path being observed.
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
        notification.context = registration.context;
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
    var registrations = (this.__z_registrations__ || {})[k],
        cache = '__' + k + '_' + 'cached' + '__',
        type, i, len, r, val, notification;

    delete this[cache];

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
    if (typeof this[k] === 'undefined') { return null; }
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

}());

