// `Z.Module` combined with `Z.Object.extend` provides a module system that
// allows for multiple inheritance through mixins.
//
// Modules are created by `extend`ing the `Z.Module` object and then defining
// properties and methods like normal. To use the module in some other type
// object simply pass it to the `extend` method when creating the type object.
// Doing this will make a copy of the module part of the type object's prototype
// chain and will cause the module object to appear in the type object's
// `ancestors`.
//
// This Zoom module system is an improvement over many other framework's module
// systems because it does not clobber properties. Special objects (called mixin
// objects) that contain copies of all properties defined directly on the module
// are created and actually inserted into the new object's prototype chain. This
// means that you can override a method provided by a module just as you would
// override a method provided by an extended type object.
Z.Module = Z.Object.extend(function() {
  var ignore = ['__z_objectId__'];

  // Internal: Overridden to throw an exeception since `Z.Module` objects should
  // never have their `create` method invoked.
  this.def('init', function() {
    throw new Error('Z.Module.create should never be called.');
  });

  // Internal: Creates a mixin object. Mixin objects are the objects that
  // actually get added to a type object's prototype chain and are created
  // everty time a module is mixed in to another object. The mixin object keeps
  // a reference to the module object that created it and all raw properties
  // defined directly on the module are copied to the mixin object.
  //
  // proto - The object to set as the prototype of the mixin object.
  //
  // Returns the new mixin object.
  this.def('mixin', function(proto) {
    var mixin = Z.create(proto), k;

    mixin.__z_module__ = this;

    for (k in this) {
      if (this.hasOwnProperty(k) && ignore.indexOf(k) === -1) {
        mixin[k] = this[k];
      }
    }

    return mixin;
  });
});

