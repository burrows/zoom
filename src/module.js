(function(undefined) {

var slice = Array.prototype.slice;

Z.Module = Z.Object.extend(function() {
  this.def('initialize', function(f) {
    this.supr();

    this.isPrototype      = true;
    this.__z_mixins__     = [];
    this.__z_defs__       = [];
    this.__z_properties__ = [];

    if (f) { this.open(f); }
  });

  this.def('createMixin', function(prototype) {
    var o     = Object.create(prototype),
        defs  = this.__z_defs__,
        props = this.__z_properties__,
        i, len;

    o.__z_module__ = this;

    for (i = 0, len = defs.length; i < len; i++) { o.def.apply(o, defs[i]); }
    for (i = 0, len = props.length; i < len; i++) { o.property.apply(o, props[i]); }

    this.__z_mixins__.push(o);

    return o;
  });

  this.def('property', function() {
    var args   = slice.call(arguments),
        r      = this.supr.apply(this, args),
        mixins = this.__z_mixins__,
        len    = mixins.length,
        i;

    this.__z_properties__.push(args);

    for (i = 0; i < len; i++) { mixins[i].property.apply(mixins[i], args); }

    return r;
  });

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
