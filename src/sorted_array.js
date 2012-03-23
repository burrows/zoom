(function(undefined) {

var slice = Array.prototype.slice;

Z.SortedArray = Z.Object.extend(function() {
  this.def('initialize', function(f) {
    this.cmp   = f || Z.cmp;
    this.array = Z.A();
  });

  this.def('toString', function() {
    if (this.isPrototype) { return this.supr(); }
    return this.array.toString().replace(/^#<Z\.Array/, '#<Z.SortedArray');
  });

  this.def('toArray', function() { return Z.Array.create(this.array); });

  this.def('size', function() {
    return this.array.size.apply(this.array, slice.call(arguments));
  });

  this.def('first', function() {
    return this.array.first.apply(this.array, slice.call(arguments));
  });

  this.def('last', function() {
    return this.array.last.apply(this.array, slice.call(arguments));
  });

  this.def('insert', function(o) {
    var a = this.array, cmp = this.cmp, i, len;

    for (i = 0, len = a.size(); i < len; i++) {
      if (cmp(a.at(i), o) === 1) { break; }
    }

    return this.array.splice(i, 0, o);
  });

  this.def('shift', function(n) { return this.array.shift(n); });
  this.def('pop', function(n) { return this.array.pop(n); });
  this.def('remove', function(o) { return this.array.remove(o); });
  this.def('index', function(o) { return this.array.index(o); });

  this.def('registerObserver', function() {
    return this.array.registerObserver.apply(this.array, slice.call(arguments));
  });

  this.def('deregisterObserver', function() {
    return this.array.deregisterObserver.apply(this.array, slice.call(arguments));
  });

  this.def('getUnknownProperty', function(k) {
    return this.array.get(k);
  });

  this.def('setUnknownProperty', function(k, v) {
    return this.array.set(k, v);
  });
});

}());
