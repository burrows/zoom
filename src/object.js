(function(undefined) {

var objectId = 1, slice = Array.prototype.slice;

Z.Object = { __z_objectId__: objectId++ };
Z.Object.open = function(f) { f.call(this); return this; };
Z.Object.open.__z_name__ = 'open';
Z.Object.def = function(name, f) {
  f.__z_name__ = name; this[name] = f;
  return this;
};
Z.Object.def.__z_name__ = 'def';

Z.Object.open(function() {
  this.def('extend', function() {
    var o = Z.create(this);
    o.__z_objectId__ = objectId++;
    return o;
  });

  this.def('create', function() {
    var o = this.extend();

    if (typeof o.initialize === 'function') {
      o.initialize.apply(o, slice.call(arguments));
    }

    return o;
  });

  // FIXME: make this a property
  this.def('objectId', function() {
    return this.__z_objectId__;
  });
});

}());

