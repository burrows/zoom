(function(undefined) {

var slice = Array.prototype.slice;

// The `Z.SortedArray` type is a sub-type of `Z.Array` that maintains its items
// in sorted order according to a given comparison function. Adding items to a
// sorted array is accomplished through the `insert` method and other array
// mutator methods have been overridden to throw exceptions when invoked.
//
// Examples
//
//   var a = Z.SortedArray.create();
//
//   a.insert(9); // => #<Z.SortedArray:17 [9]>
//   a.insert(7); // => #<Z.SortedArray:17 [7, 9]>
//   a.insert(2); // => #<Z.SortedArray:17 [2, 7, 9]>
//   a.insert(8); // => #<Z.SortedArray:17 [2, 7, 8, 9]>
//   a.push(12);  // => Error: Z.SortedArray.push: use `insert` to add items to a sorted array
Z.SortedArray = Z.Array.extend(function() {
  // Internal: Observer method that gets triggered when a dependent path on an
  // item changes. Since the dependent path determins the sort order of the
  // items, this method simply removes the item from the array and then
  // re-inserts it at the correct position.
  function dependentPathDidChange(n) {
    this.remove(n.observee);
    this.insert(n.observee);
  }

  // Public: The `Z.SortedArray` constructor. The sorting behavior can be
  // specified several ways. By default, `Z.cmp` is used to sort the items in
  // ascending order, but the `isDescending` option can be set to reverse this
  // order. If the `path` option is given, sorting is performed using the values
  // obtained by getting the path from each item. Finally, a comparison function
  // can be given to implement custom ordering.
  //
  // `Z.SortedArray` is of course fully KVC and KVO compliant. When constructed
  // with the `path` option, the path is observed on each item and when changes
  // happen the corresponding item is moved to its new position in the array.
  // Similarily, when constructed with the `compareFn` option, you can also
  // specify the paths the function depends on using the `dependsOn` option.
  //
  // opts - A native object containing zero or more of the following:
  //   path         - A property path that determines sort order.
  //   compareFn    - A function implementing custom comparison logic. Be sure
  //                  to also specify any property paths it depends on using
  //                  the `dependsOn` option.
  //   dependsOn    - A native array containing dependent property paths. This
  //                  option should be used in conjunction with the `compareFn`
  //                  option.
  //   isDescending - Set this option to `true` to sort items in descending
  //                  order.
  this.def('init', function(opts) {
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

  // Internal: Overrides `Z.Array.splice` in order to add dependent path
  // observers. This method should not be used by client code, instead use the
  // `insert` and `remove` methods to mutate the array.
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

  // Public: Insert a new object into the array. This method will ensure that
  // the object is inserted in the correct location in order to maintain sorted
  // order.
  //
  // o - The object to insert.
  //
  // Returns the receiver.
  this.def('insert', function(o) {
    var cmp = this.__z_cmp__, i, len;

    for (i = 0, len = this.size(); i < len; i++) {
      if (cmp(this.at(i), o) > 0) { break; }
    }

    return this.splice(i, 0, o);
  });

  // Public: Returns the index of the given object in the array and `null` if
  // its not present. This overrides `Z.Array.index` since it performs a linear
  // search and instead performs a binary search.
  //
  // o - The object to find the index of.
  //
  // Returns the index of the object or `null` if its not present.
  this.def('index', function(o) { return Z.binsearch(o, this); });

  // Internal: General array manipulations are not allowed in a sorted array.
  this.def('push', function() {
    throw new Error(Z.fmt("%@.push: use `insert` to add items to a sorted array",
                          this.typeName()));
  });

  // Internal: General array manipulations are not allowed in a sorted array.
  this.def('unshift', function() {
    throw new Error(Z.fmt("%@.unshift: use `insert` to add items to a sorted array",
                          this.typeName()));
  });

  // Internal: General array manipulations are not allowed in a sorted array.
  this.def('at', function(i, v) {
    if (arguments.length === 1) { return this.supr(i); }
    throw new Error(Z.fmt("%@.at: use `insert` to add items to a sorted array",
                          this.typeName()));
  });

  // Internal: General array manipulations are not allowed in a sorted array.
  this.def('sort$', function() {
    throw new Error(Z.fmt("%@.sort$: can't sort a sorted array in place",
                          this.typeName()));
  });
});

}());
