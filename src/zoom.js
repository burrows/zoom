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

var slice      = Array.prototype.slice,
    namespaces = [ [Z, 'Z'], [Z.root, ''] ];

// The identity function - simply returns its argument.
Z.identity = function(x) { return x; };

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

Z.addNamespace = function(o, name) { namespaces.push([o, name || '']); };

Z.removeNamespace = function(o) {
  namespaces = namespaces.filter(function(namespace) {
    return namespace[0] != o;
  });
};

Z.namespaces = function() { return slice.call(namespaces); };

Z.hash = function(o) { return hash(o, []); };

// FIXME: This code is a bit buggy when it comes to recursive data structures
// (objects and arrays), see http://bugs.ruby-lang.org/issues/1448 for more
// info.
function hash(o, seen) {
  var type = typeof o, v, size, key, i, len;

  if (o === null) {
    return murmur('null', 1);
  }
  else if (type === 'undefined') {
    return murmur('undefined', 1);
  }
  else if (type === 'function' || type === 'number') {
    return murmur(o.toString(), 1);
  }
  else if (type == 'string') {
    return murmur(o, 1);
  }
  else if (o.isZObject) {
    return o.hash();
  }
  else if (Z.isNativeArray(o)) {
    v = o.length;

    for (i = 0, len = o.length; i < len; i++) {
      if (seen.indexOf(o[i]) >= 0) { continue; }
      seen.push(o[i]);
      v = ((v & 0x7fffffff) << 1) ^ hash(o[i], seen);
    }

    return v;
  }
  else {
    v    = 0;
    size = 0;

    for (key in o) {
      if (!o.hasOwnProperty(key)) { continue; }
      size++;
      if (seen.indexOf(o[key]) >= 0) { continue; }
      seen.push(o[key]);
      v ^= hash(key, seen);
      v ^= hash(o[key], seen);
    }

    return v ^= size;
  }
}

// Borrowed from https://github.com/garycourt/murmurhash-js.
function murmur(key, seed) {
  var remainder = key.length & 3, // key.length % 4
      bytes     = key.length - remainder,
      h1        = seed,
      c1        = 0xcc9e2d51,
      c2        = 0x1b873593,
      i         = 0,
      h1b, c1b, c2b, k1;

  while (i < bytes) {
    k1 = ((key.charCodeAt(i) & 0xff)) |
         ((key.charCodeAt(++i) & 0xff) << 8) |
         ((key.charCodeAt(++i) & 0xff) << 16) |
         ((key.charCodeAt(++i) & 0xff) << 24);
    ++i;

    k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
    h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
  }

  k1 = 0;

  switch (remainder) {
    case 3:
      k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
      /* falls through */
    case 2:
      k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
      /* falls through */
    case 1:
      k1 ^= (key.charCodeAt(i) & 0xff);

      k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
      k1 = (k1 << 16) | (k1 >>> 16);
      k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
      h1 ^= k1;
  }

  h1 ^= key.length;

  h1 ^= h1 >>> 16;
  h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
  h1 ^= h1 >>> 13;
  h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

}());

