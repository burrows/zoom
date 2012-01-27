(function(undefined) {

var slice = Array.prototype.slice;

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

// Borrowed from https://github.com/garycourt/murmurhash-js.
Z.murmur = function(key, seed) {
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
};

}());
