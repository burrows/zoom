(function(undefined) {

var slice = Array.prototype.slice;

Z.Enumerable = Z.Module.create(function() {
  this.isEnumerable = true;

  this.def('map', function(f) {
    return this.inject(Z.A(), function(acc) {
      acc.push(f.apply(null, slice.call(arguments, 1)));
      return acc;
    });
  });

  this.def('first', function() {
    try { this.each(function(item) { throw item; }); }
    catch (first) { return first; }
    return null;
  });

  this.def('inject', function(initial, f) {
    var skip = false, acc;

    if (arguments.length === 1) {
      f       = initial;
      initial = this.first();
      skip    = true;
    }

    acc = initial;

    this.each(function() {
      if (skip) { skip = false; return; }
      acc = f.apply(null, [acc].concat(slice.call(arguments)));
    });

    return acc;
  });

  this.def('reject', function(f) {
    return this.inject(Z.Array.create(), function(acc, item) {
      if (!f(item)) { acc.push(item); }
      return acc;
    });
  });

  this.def('invoke', function(name) {
    return this.map(function(item) { return item[name](); });
  });

  this.def('pluck', function(path) {
    return this.map(function(item) {
      if (!item) { return item; }
      return item.isZObject ? item.get(path) : item[path];
    });
  });
});

}());
