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

var slice = Array.prototype.slice;

// Copies all of the properties in the source objects over to the destination
// object. The sources are processed in order, so subsequent sources will
// override properties of the same name in previous sources.
//
// * `o`       - The destination object.
// * `sources` - One ore more source objects.
//
// Returns `o`.
Z.merge = function(o) {
  var sources = slice.call(arguments, 1), source, i, len, k, v;

  for (i = 0, len = sources.length; i < len; i++) {
    source = sources[i];
    for (k in source) { o[k] = source[k]; }
  }

  return o;
};

// Takes a native javascript object and merges in properties from a list of
// default objects if they are not already present in the first object.
//
// * `o`           - The object to merge default values into
// * `defaults...` - One or more objects that contain default values.
//
// Returns `o`.
Z.defaults = function(o) {
  var defs = slice.call(arguments, 1), def, i, len, k, v;

  for (i = 0, len = defs.length; i < len; i++) {
    def = defs[i];
    for (k in def) { if (!o.hasOwnProperty(k)) { o[k] = def[k]; } }
  }

  return o;
};

// Returns whether the given object is a native javascript array. Uses
// `Array.isArray` if it is available.
//
// * `o` - The object to check.
//
// Returns `true` if the object is a native array and `false` otherwise.
Z.isNativeArray = Array.isArray || function(o) {
  return !!(o && o.concat && o.unshift && !o.callee && !o.isZArray);
};

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

// Creates a shallow copy of the given object.
//
// `o` - Any object.
//
// Returns a new object with all of the keys copied from `o`.
Z.dup = function(o) { return Z.merge({}, o); };

// Deletes a property from an object and returns its value.
//
// `o`    - Any object.
// `prop` - The property to delete.
//
// Returns the value of the given property name.
Z.del = function(o, prop) {
  var val = o[prop];
  delete o[prop];
  return val;
};

Z.fmt = function(s) {
  var vals = slice.call(arguments, 1), i = 0;

  return s.replace(/%@/g, function(m) {
    var val = vals[i++];
    return typeof val !== 'undefined' ? val.toString() : '';
  });
};

Z.create = Object.create || function(o) {
  var f = function() {};
  f.prototype = o;
  return new f();
};

Z.getPrototypeOf = Object.getPrototypeOf || function(o) {
  throw new Error('polyfill this');
};

}());

