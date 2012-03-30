(function(undefined) {

var slice = Array.prototype.slice;

Z.SortedArray = Z.Array.extend(function() {
  function dependentPathDidChange(n) {
    this.remove(n.observee);
    this.insert(n.observee);
  }

  this.def('initialize', function(opts) {
    this.supr();

    opts = opts || {};

    this.__z_paths__ = opts.dependsOn ? [].concat(opts.dependsOn) : [];

    if (opts.path) {
      this.__z_cmp__ = function(a, b) {
        var r = Z.cmp(a.get(opts.path), b.get(opts.path));
        return opts.isDescending ? r * -1 : r;
      };

      this.__z_paths__.push(opts.path);
    }
    else if (opts.compareFn) {
      this.__z_cmp__ = opts.compareFn;
    }
    else if (opts.isDescending) {
      this.__z_cmp__ = function(a, b) { return -1 * Z.cmp(a, b); };
    }
    else {
      this.__z_cmp__ = Z.cmp;
    }
  });

  this.def('splice', function(i, n) {
    var size    = this.size(),
        idx     = i < 0 ? size + i : i,
        added   = slice.call(arguments, 2),
        removed = n > 0 ? this.slice(idx, n).toNative() : [],
        paths   = this.__z_paths__,
        j, len, k, plen;


    if (paths) {
      for (j = 0, plen = paths.length; j < plen; j++) {
        for (k = 0, len = added.length; k < len; k++) {
          added[j].observe(paths[j], this, dependentPathDidChange);
        }

        for (k = 0, len = removed.length; k < len; k++) {
          removed[j].stopObserving(paths[j], this, dependentPathDidChange);
        }
      }
    }

    return this.supr.apply(this, slice.call(arguments));
  });

  this.def('insert', function(o) {
    var cmp = this.__z_cmp__, i, len;

    for (i = 0, len = this.size(); i < len; i++) {
      if (cmp(this.at(i), o) > 0) { break; }
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
