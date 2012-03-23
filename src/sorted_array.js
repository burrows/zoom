(function(undefined) {

var slice = Array.prototype.slice;

Z.SortedArray = Z.Array.extend(function() {
  this.def('initialize', function(f) {
    this.cmp = f || Z.cmp;
    this.supr();
  });

  this.def('insert', function(o) {
    var cmp = this.cmp, i, len;

    for (i = 0, len = this.size(); i < len; i++) {
      if (cmp(this.at(i), o) === 1) { break; }
    }

    return this.splice(i, 0, o);
  });

  this.def('push', function() {
    throw new Error(Z.fmt("%@.push: use `insert` to add items to a sorted array",
                          this.prototypeName()));
  });

  this.def('unshift', function() {
    throw new Error(Z.fmt("%@.unshift: use `insert` to add items to a sorted array",
                          this.prototypeName()));
  });

  this.def('at', function(i, v) {
    if (arguments.length === 1) { return this.supr(i); }
    throw new Error(Z.fmt("%@.at: use `insert` to add items to a sorted array",
                          this.prototypeName()));
  });

  this.def('sort$', function() {
    throw new Error(Z.fmt("%@.sort$: can't sort a sorted array in place",
                          this.prototypeName()));
  });
});

}());
