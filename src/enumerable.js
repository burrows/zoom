(function(undefined) {

Z.Enumerable = Z.Module.create(function() {
  this.isEnumerable = true;

  this.def('map', function(f) {
    return this.inject(Z.A(), function(acc, item) {
      acc.push(f(item));
      return acc;
    });
  });

  this.def('first', function() {
    try { this.each(function(item) { throw item; }); }
    catch (first) { return first; }
    return null;
  });

  this.def('find', function(notfound, f) {
    if (arguments.length === 1) {
      f = notfound;
      notfound = null;
    }

    try { this.each(function(item) { if (f(item)) { throw item; } }); }
    catch (item) { return item; }

    return notfound;
  });

  this.def('inject', function(initial, f) {
    var skip = false, acc;

    if (arguments.length === 1) {
      f       = initial;
      initial = this.first();
      skip    = true;
    }

    acc = initial;

    this.each(function(item) {
      if (skip) { skip = false; return; }
      acc = f(acc, item);
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

  this.def('toArray', function() {
    return this.inject(Z.A(), function(acc, item) { return acc.push(item); });
  });

  this.def('sort', function(fn) { return this.toArray().sort(fn); });
});

}());
