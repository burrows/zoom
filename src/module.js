(function(undefined) {

var slice = Array.prototype.slice;

// `Z.Module` provides a module system for Zoom that is based off of Ruby's.
// Modules are essentially collections of method and property definitions that
// can be mixed in to type objects.
//
// Modules are created by with the `Z.Module.create` method, passing it a
// "module body" similar to how type objects are created with `Z.Object.extend`.
// Modules can be mixed in to type objects when the type object is created.
// Modules mixed in to a type object become part of the type object's ancestor
// chain, so methods like `Z.Object.isA` work when passed module objects.
//
// The Zoom module system is an improvement over many other framework's module
// systems because it does not clobber properties and allows modules to remain
// open even after they are mixed in to a type object. In other words, its
// possible to define a module, mix it in to a type object, then later define
// a new method on the module and have that method be available on the type
// object it was previously mixed in to.
Z.Module = Z.Object.extend(function() {
  // Internal: Sets up some private properties on the module object.
  //
  // f - A function containing the module body.
  //
  // Returns nothing.
  this.def('initialize', function(f) {
    this.supr();

    this.isType           = true;
    this.__z_mixins__     = [];
    this.__z_defs__       = [];
    this.__z_properties__ = [];

    if (f) { this.open(f); }
  });

  // Internal: Creates a mixin object. Mixin objects are the objects that
  // actually get added to a type object's prototype chain and are created
  // everty time a module is mixed in to a type object. The mixin object keeps a
  // reference to the module object that created it and the methods and
  // properties defined on the module are synced to the mixin object.
  //
  // prototype - The object to set as the prototype of the mixin object.
  //
  // Returns the new mixin object.
  this.def('createMixin', function(prototype) {
    var o     = Z.create(prototype),
        defs  = this.__z_defs__,
        props = this.__z_properties__,
        i, len;

    o.__z_module__ = this;

    for (i = 0, len = defs.length; i < len; i++) { o.def.apply(o, defs[i]); }
    for (i = 0, len = props.length; i < len; i++) { o.prop.apply(o, props[i]); }

    this.__z_mixins__.push(o);

    return o;
  });

  // Public: Overrides `Z.Object.prop` in order to forward the property
  // definition out to all mixin objects this module has created. This is what
  // allows properties that are defined on a module after a module has been
  // mixed in to a type object to subseqently be available on the type object.
  //
  // Accepts the same arguments as `Z.Object.prop`.
  this.def('prop', function() {
    var args   = slice.call(arguments),
        r      = this.supr.apply(this, args),
        mixins = this.__z_mixins__,
        len    = mixins.length,
        i;

    this.__z_properties__.push(args);

    for (i = 0; i < len; i++) { mixins[i].prop.apply(mixins[i], args); }

    return r;
  });

  // Public: Overrides `Z.Object.def` in order to forward the method definition
  // out to all mixin objects this module has created. This is what allows
  // methods that are defined on a module after a module has been mixed in to a
  // type object to subseqently be available on the type object.
  //
  // Accepts the same arguments as `Z.Object.def`.
  this.def('def', function() {
    var args   = slice.call(arguments),
        r      = this.supr.apply(this, args),
        mixins = this.__z_mixins__,
        len    = mixins.length,
        i;

    this.__z_defs__.push(args);

    for (i = 0; i < len; i++) { mixins[i].def.apply(mixins[i], args); }

    return r;
  });
});

}());

