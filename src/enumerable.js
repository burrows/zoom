(function(undefined) {

// `Z.Enumerable` is a module that provides collection type objects with many
// useful traversal, searching, and sorting methods. In order for a type object
// to use `Z.Enumerable`, it must implement the `each` method that takes a
// function and invokes it once for each item in its collection. In order to
// use the `sort` method provided, the type object mixing in `Z.Enumerable` will
// also need to implement the `cmp` method used by `Z.Orderable`.
//
// The core type objects `Z.Array` and `Z.Hash` mixin `Z.Enumerable`.
//
// Examples
//
//   Z.A(1,2,3).map(function(x) { return x * 2; }); // => #<Z.Array:18 [2, 4, 6]>
//
//   Z.H('foo', 1, 'bar', 2).map(function(t) {
//     return [t[0].toUpperCase(), t[1]]
//   });                                            // => #<Z.Array:24 [['FOO', 1], ['BAR', 2]]>
//
//   Z.A(1,2,3,4,5,6).reject(function(x) {
//     return x % 2 !== 0;
//   });                                            // => #<Z.Array:29 [2, 4, 6]>
//
//   Z.A(1,2,3,4,5,6).inject(function(acc, x) {
//     return acc + x;
//   });                                            // => 21
//
//   Z.A(Z.A(), Z.A(1), Z.A(1,2)).pluck('size');    // => #<Z.Array:42 [0, 1, 2]>
Z.Enumerable = Z.Module.create(function() {
  // Internal: An exception object to throw in order to short circuit out of an
  // `each` iteration.
  function EarlyExit(value) { this.value = value; }

  // Public: Returns a new array containing the results of invoking the given
  // function once for each item in the enumerable.
  //
  // f - A function that operates on an individual item in the enumerable.
  //
  // Returns nothing.
  this.def('map', function(f) {
    return this.inject(Z.A(), function(acc, item) {
      acc.push(f(item));
      return acc;
    });
  });

  // Public: Returns the first item in the enumerable.
  this.def('first', function() {
    try {
      this.each(function(item) { throw new EarlyExit(item); });
    }
    catch (e) {
      if (e instanceof EarlyExit) { return e.value; } else { throw e; }
    }
    return null;
  });

  // Public: Passes each item of the enumerable to the given function and
  // returns the first item for which the function returns `true`. A default
  // value can optionally be provided and will be returned if the function never
  // returns `true`.
  //
  // notfound - A default value to return if `f` never returns `true` (default:
  //           `null`).
  // f        - A function that takes an item from the enumerable and returns a
  //            boolean.
  //
  // Returns the first item for which `f` returns true or `notfound` if it never
  //   returns `true`.
  this.def('find', function(notfound, f) {
    if (arguments.length === 1) {
      f = notfound;
      notfound = null;
    }

    try {
      this.each(function(item) { if (f(item)) { throw new EarlyExit(item); } });
    }
    catch (e) {
      if (e instanceof EarlyExit) { return e.value; } else { throw e; }
    }

    return notfound;
  });

  // Public: Combines all items in the enumerable into a result by invoking the
  // given function on each item along with a propagated accumulator value.
  // After iteration is complete, the final accumulator value is returned.
  //
  // initial - The initial value of the accumulator (default: first item in the
  //           eumerable).
  // f       - A function that takes the current accumulator value and an item
  //           in the enumerable and returns a new accumulator value.
  //
  // Examples
  //
  //   // sum a list of numbers
  //   Z.A(1,2,3,4).inject(function(acc, x) { return acc + x; });         // => 10
  //
  //   // multiply a list of number
  //   Z.A(5,6,7,8,9,10).inject(1, function(acc, x) { return acc * x; }); // => 151200
  //
  //   // find the longest word
  //   Z.A('cat', 'sheep', 'bear').inject(function(acc, x) {
  //     return x.length > acc.length ? x : acc
  //   });                                                                // => 'sheep'
  //
  // Returns the final value of the accumulator.
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

  // Public: Returns a `Z.Array` containing all items of the enumerable for
  // which the given function returns `true`.
  //
  // f - A function that takes a item of the enumerable and returns a boolean.
  //
  // Examples
  //
  //   Z.A(1,2,3,4,5,6).select(function(x) { return x % 2 === 0; }); // => #<Z.Array:29 [2, 4, 6]>
  //
  // Returns a `Z.Array` instance.
  this.def('select', function(f) {
    return this.inject(Z.A(), function(acc, item) {
      if (f(item)) { acc.push(item); }
      return acc;
    });
  });

  // Public: Returns a `Z.Array` containing all items of the enumerable for
  // which the given function returns `false`.
  //
  // f - A function that takes a item of the enumerable and returns a boolean.
  //
  // Examples
  //
  //   Z.A(1,2,3,4,5,6).reject(function(x) { return x % 2 !== 0; }); // => #<Z.Array:29 [2, 4, 6]>
  //
  // Returns a `Z.Array` instance.
  this.def('reject', function(f) {
    return this.inject(Z.A(), function(acc, item) {
      if (!f(item)) { acc.push(item); }
      return acc;
    });
  });

  // Public: Returns a `Z.Hash` that maps the results of the given function to
  // `Z.Array`s containing the coresponding items that produced the result.
  //
  // f - A function that takes an item of the enumerable and returns any value.
  //
  // Examples
  //
  //   Z.A(1,2,3,4,5,6).groupBy(function(i) { return i % 2; });
  //   // => #<Z.Hash:41 {1: #<Z.Array:42 [1, 3, 5]>, 0: #<Z.Array:44 [2, 4, 6]>}>
  //
  // Returns a `Z.Hash` instance.
  this.def('groupBy', function(f) {
    return this.inject(Z.H(), function(acc, item) {
      var k = f(item);
      if (!acc.at(k)) { acc.at(k, Z.A()); }
      acc.at(k).push(item);
      return acc;
    });
  });

  // Public: Returns `true` if the given fuction returns `true` for every item
  // in the enumerable and `false` otherwise.
  //
  // f - A function that takes a item of the enumerable and returns a boolean.
  //
  // Examples
  //
  //   Z.A(5,12,21).all(function(x) { return x > 10; }); // => false
  //   Z.A(5,12,21).all(function(x) { return x > 4; });  // => true
  //
  // Returns a boolean.
  this.def('all', function(f) {
    try {
      this.each(function(item) { if (!f(item)) { throw new EarlyExit(); } });
    }
    catch (e) {
      if (e instanceof EarlyExit) { return false; } else { throw e; }
    }

    return true;
  });

  // Public: Returns `true` if the given fuction returns `true` for any item in
  // the enumerable and `false` otherwise.
  //
  // f - A function that takes a item of the enumerable and returns a boolean.
  //
  // Examples
  //
  //   Z.A(5,12,21).any(function(x) { return x > 10; });  // => true
  //   Z.A(5,12,21).any(function(x) { return x === 6; }); // => false
  //
  // Returns a boolean.
  this.def('any', function(f) {
    try {
      this.each(function(item) { if (f(item)) { throw new EarlyExit(); } });
    }
    catch (e) {
      if (e instanceof EarlyExit) { return true; } else { throw e; }
    }

    return false;
  });

  // Public: Invokes the given method name on each item of the enumerable and
  // returns a `Z.Array` containing the results.
  //
  // name - The name of a method that each item in the enumerable responds to.
  //
  // Examples
  //
  //   Z.A(Z.A(2,3,1), Z.A(5,3,7)).invoke('sort'); // => #<Z.Array:20 [#<Z.Array:21 [1, 2, 3]>, #<Z.Array:23 [3, 5, 7]>]>
  //
  // Returns a `Z.Array` instance.
  this.def('invoke', function(name) {
    return this.map(function(item) { return item[name](); });
  });

  // Public: Gets the given property path from each item in the enumerable and
  // returns a `Z.Array` containing the results.
  //
  // path - A string containing a property key or path.
  //
  // Examples
  //
  //   Z.A(Z.A(4,8,2), Z.A(9,7,3), Z.A(8)).pluck('first'); // => #<Z.Array:27 [4, 9, 8]>
  //
  // Returns a `Z.Array` instance.
  this.def('pluck', function(path) {
    return this.map(function(item) {
      if (!item) { return item; }
      return Z.isA(item, Z.Object) ? item.get(path) : item[path];
    });
  });

  // Public: Returns a `Z.Array` containing each item of the enumerable.
  //
  // Examples
  //
  //   Z.H('foo', 1, 'bar', 2, 'baz', 3).toArray(); // => #<Z.Array:37 [['foo', 1], ['bar', 2], ['baz', 3]]>
  //
  // Returns a `Z.Array` instance.
  this.def('toArray', function() {
    return this.inject(Z.A(), function(acc, item) { return acc.push(item); });
  });

  // Public: Returns a `Z.Array` containing the sorted contents of the
  // enumerable. In order to use this method, the type object must implement the
  // `cmp` method.
  //
  // fn - The comparison function to use (default: `Z.cmp`).
  //
  // Returns a `Z.Array` instance.
  this.def('sort', function(fn) { return this.toArray().sort(fn); });
});

}());

