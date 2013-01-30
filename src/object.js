(function(undefined) {

var objectId = 1, slice = Array.prototype.slice;

// `Z.Object` is the top level object of the Zoom object hierarchy. All other
// Zoom objects descend from it.
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
// can be mixed in to type objects. Modules are non-destructive, meaning that
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
//   App.Flyable = Z.Module.extend(function() {
//     this.def('fly', function() { return 'flying'; });
//   });
//
//   App.Bird = App.Animal.extend(App.Flyable); // no type body
//
//   App.Bird.ancestors();    // => [App.Bird, App.Flyable, App.Animal, Z.Object]
//   App.Bird.create().fly(); // => 'flying'
Z.Object = { objectId: objectId++, isZObject: true, isType: true };

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
  // Public: Extends the receiver by creating a new type object with the
  // receiver set as the new type object's prototype. This is typically called
  // on type objects to further extend their behavior. If the receiver responds
  // to the `extended` method, that method will be invoked with the newly
  // created object passed as an argument.
  //
  // `Z.Module` objects may be passed to mix them in to the new object's
  // prototype chain. Special care is taken to ensure that no modules are
  // included in the prototype chain multiple times. Note that `extend` is the
  // only way to mix in a module, it is not allowed after the object has been
  // created (this is due to the fact that the ECMAScript standard does not
  // define a way to modify an object's prototype after it has been created).
  //
  // *mods - Zero or more `Z.Module` objects to mix in to the prototype chain.
  // f     - A function to execute in the context of the new object (default:
  //         `null`).
  //
  // Examples
  //
  //   Person = Z.Object.extend(function() {
  //     this.def('first', function() {});
  //     this.def('last', function() {});
  //   });
  //
  // Returns the new object.
  this.def('extend', function() {
    var args  = slice.call(arguments),
        f     = typeof args[args.length - 1] === 'function' ? args.pop() : null,
        proto = this,
        mods  = {},
        mod, ancestors, i, j, n, o;

    for (i = 0, n = args.length; i < n; i++) {
      ancestors = args[i].ancestors();
      for (j = ancestors.length; j >= 0; j--) {
        mod = ancestors[j];
        if (Z.isA(mod, Z.Module) && mod !== Z.Module && !mods[mod.objectId]) {
          proto = mod.mixin(proto);
          mods[mod.objectId] = true;
        }
      }
    }

    o = Z.create(proto);

    o.isType   = true;
    o.objectId = objectId++;

    if (this.respondTo('extended')) { this.extended(o); }

    if (f) { f.call(o); }

    return o;
  });

  // Public: Creates a "concrete instance" of the receiver and invokes the
  // `init` method. A concrete instance is simply an object created from a type
  // object or another concrete instance using the `create` method.
  //
  // *args - An arbitrary list of arguments, they are forwarded on to the `init`
  //         method.
  //
  // Returns the newly created and initialized object.
  this.def('create', function() {
    var o = this.extend();
    o.isType = false;
    if (o.respondTo('init')) { o.init.apply(o, slice.call(arguments)); }
    return o;
  });

  // Public: The `Z.Object` constructor. Override this method to initialize
  // objects created via the `.create` method.
  this.def('init', function() { return this; });

  // Public: The `Z.Object` destructor. Override this method to perform an
  // teardown procedures.
  this.def('destroy', function() { return this; });

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
    var _this = this, type, props, recursed, a, v;

    if (this.isType) { return this.typeName(); }

    type  = this.type();
    props = this.toStringProperties();
    a     = [];

    recursed = Z.detectRecursion(this, function() {
      var i, len;

      for (i = 0, len = props.length; i < len; i++) {
        v = Z.isFunction(_this[props[i]]) ? _this[props[i]]() : _this[props[i]];
        a.push(props[i] + ': ' + Z.inspect(v));
      }
    });

    return Z.fmt("#<%@:%@%@>", type.typeName(), this.objectId,
                 recursed ? ' ...' : (a.length > 0 ? ' ' : '') + a.join(', '));
  });

  // Public: Returns a hash value for the receiver. This method is used by the
  // `Z.Hash` type to generate hash codes for objects used as keys. The default
  // implementation uses the object's id to generate a hash code. You'll likely
  // want to override this in the sub-types if you want to use them as hash
  // keys.
  //
  // Returns a number.
  this.def('hash', function() { return Z.hash(this.objectId); });

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
});

}());

