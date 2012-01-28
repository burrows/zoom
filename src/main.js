(function(undefined) {

if (typeof exports !== 'undefined') {
  Z = exports;
  Z.platform = 'node';
  Z.root = global;
}
else {
  Z = window.Z = {};
  Z.platform = 'browser';
  Z.root = window;
}

var slice = Array.prototype.slice, namespaces = [ [Z, 'Z'] ];

// Converts the given object to a string.
//
// FIXME: handle native objects
//
// * `o` - The object to convert to a string.
//
// Returns a string representation of the given object.
Z.toString = function(o) {
  return (o && o.toString) ? o.toString() : String(o);
};

// Performs an object equality test. If the first argument is an instance of
// `Z.Object` then it is sent the `eq` method, otherwise a deep object comparison
// is performed.
//
// FIXME: do a deep object comparison when given native objects
//
// `a` - Any object.
// `b` - Any object.
//
// Returns `true` if the objects are equal and `false` otherwise.
Z.eq = function(a, b) {
  if (a && a.isZObject) { return a.eq(b); }
  return a === b;
};

Z.addNamespace = function(o, name) { namespaces.push([o, name || '']); };

Z.removeNamespace = function(o) {
  namespaces = namespaces.filter(function(namespace) {
    return namespace[0] != o;
  });
};

Z.namespaces = function() { return slice.call(namespaces); };

}());

