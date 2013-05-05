// `Z.Orderable` is a module that adds some convenience methods to objects that
// can be ordered in some way. Type object's that mixin `Z.Comparable` must
// implement the `cmp` method, which compares the receiver with its argument and
// returns `-1`, `0`, or `+1` depending on when the receiver is less than, equal
// to, or greater than the argument. If the argument is not comparable to the
// receiver then `cmp` should return `null`.
//
// Examples
//
//    App.X = Z.Object.extend(Z.Orderable, function() {
//      this.prop('rank');
//      this.def('cmp', function(other) {
//        return Z.cmp(this.rank(), other.rank());
//      });
//    });
//
//    var x1 = App.X.create({rank: 1}),
//        x2 = App.X.create({rank: 2}),
//        x3 = App.X.create({rank: 3});
//
//    x1.cmp(x2); // => -1
//    x3.cmp(x2); // => 1
//    x1.lt(x2);  // => true
//    x1.gt(x2);  // => false
//    x3.max(x2); // => #<App.X:20 rank: 3>
//    x3.min(x2); // => #<App.X:19 rank: 2>
Z.Orderable = Z.Module.extend(function() {
  // Public: Object comparison method. This method must be overridden in the
  // type objects that mixin `Z.Orderable`. It should return `-1`, `0`, or `+1`
  // depending on whether the receiver is less than, equal to, or greater than
  // the given argument.
  //
  // other - An object to compare the receiver to.
  //
  // Throws `Error` with a message to define this method in the type object.
  this.def('cmp', function() {
    throw new Error('Z.Orderable.cmp: not implemented - types that mixin `Z.Orderable` must define a `cmp` method');
  });

  // Public: Returns `true` if the receiver is less than `other` and `false`
  // otherwise.
  this.def('lt', function(other) {
    return this.cmp(other) < 0;
  });

  // Public: Returns `true` if the receiver is less than or equal to `other` and
  // `false` otherwise.
  this.def('lte', function(other) {
    return this.cmp(other) <= 0;
  });

  // Public: Returns `true` if the receiver is greater than `other` and `false`
  // otherwise.
  this.def('gt', function(other) {
    return this.cmp(other) > 0;
  });

  // Public: Returns `true` if the receiver is greater than or equal to `other`
  // and `false` otherwise.
  this.def('gte', function(other) {
    return this.cmp(other) >= 0;
  });

  // Public: Returns the greater object between the receiver and `other`.
  this.def('max', function(other) {
    return this.cmp(other) >= 0 ? this : other;
  });

  // Public: Returns the lesser object between the receiver and `other`.
  this.def('min', function(other) {
    return this.cmp(other) <= 0 ? this : other;
  });
});

// Public: Compares any two objects, including native objects. If the first
// argument is a `Z.Orderable`, this method simply delegates to that object's
// `cmp` method, otherwise it falls back to using the javascript `<` and `>`
// operators.
//
// a - The first object to compare.
// b - The second object to compare.
//
// Returns `-1`, `0`, or `+1` depending on whether the `a` is less than, equal
//   to, or greater than `b`.
Z.cmp = function(a, b) {
  if (Z.isA(a, Z.Orderable)) { return a.cmp(b); }

  if (a < b)      { return -1; }
  else if (a > b) { return 1; }
  else            { return 0; }
};

// Public: Returns the greater object between the two given arguments.
Z.max = function(a, b) { return Z.cmp(a, b) >= 0 ? a : b; };

// Public: Returns the lesser object between the two given arguments.
Z.min = function(a, b) { return Z.cmp(a, b) <= 0 ? a : b; };

