(function(undefined) {

Z.Module = Z.Object.extend(function() {
  this.def('initialize', function(f) {
    this.supr();
    this.__z_mixins__ = [];

    if (f) { this.open(f); }
  });

  this.def('createMixin', function(prototype) {
    var o = Z.create(prototype), k;

    o.__z_module__ = this;

    for (k in this) {
      if (this.hasOwnProperty(k) && !k.match(/^__z_/)) { o[k] = this[k]; }
    }

    this.__z_mixins__.push(o);

    return o;
  });

  this.def('def', function(name, f) {
    var r       = this.supr(name, f),
        objects = this.__z_mixins__,
        len     = objects.length,
        i;

    r = this.supr(name, f);

    for (i = 0; i < len; i++) { objects[i].def(name, f); }

    return f;
  });
});

}());
