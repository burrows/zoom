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
    var args  = slice.call(arguments),
        f     = typeof args[args.length - 1] === 'function' ? args.pop() : null,
        proto = this,
        i, len, o;

    for (i = 0, len = args.length; i < len; i++) {
      proto = args[i].createMixin(proto);
    }

    o = Z.create(proto);

    o.__z_objectId__ = objectId++;

    if (f) { f.call(o); }

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

  this.def('supr', function supr() {
    var caller = supr.caller,
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
      throw new Error(Z.fmt('Z.Object.supr: no super method `%@` found for %@', name, this.toString()));
    }

    return method.apply(this, args);
  });

  this.def('respondTo', function(name) {
    return typeof this[name] === 'function';
  });

  this.def('ancestors', function() {
    var a = [], p = this;

    while ((p = Z.getPrototypeOf(p)) !== Object.prototype) {
      a.push(Z.isMixin(p) ? p.__z_module__ : p);
    }

    return a;
  });

  this.def('isA', function(o) { return this.ancestors().indexOf(o) !== -1; });

  this.def('name', function() {
    var namespaces = Z.namespaces(), namespace, i, len, k;

    for (i = 0, len = namespaces.length; i < len; i++) {
      namespace = namespaces[i];

      for (k in namespace[0]) {
        if (namespace[0][k] === this) {
          return namespace[1].length > 0 ? Z.fmt("%@.%@", namespace[1], k) : k;
        }
      }
    }

    return '(Unknown)';
  });

  this.def('toString', function() {
    var p = this;

    while (p && Z.isZObject(p) && (name = p.name()) === '(Unknown)') {
      p = Z.getPrototypeOf(p);
    }

    return Z.fmt("#<%@:%@>", name, this.objectId());
  });
});

}());

