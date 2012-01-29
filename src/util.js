(function(undefined) {

var slice                    = Array.prototype.slice,
    toString                 = Object.prototype.toString,
    seenObjects              = [],
    InnerRecursionDetected   = {},
    detectOutermostRecursion = false;

// Polyfill for Object.create. Creates a new object with the given object as the
// prototype.
//
// * `o` - The prototype object.
//
// Returns a new Object instance with `o` as the prototype.
Z.create = Object.create || function(o) {
  var f = function() {}, o2;
  f.prototype = o;
  o2 = new f();
  o2.__z_proto__ = o;
  return o2;
};

Z.getPrototypeOf = Object.getPrototypeOf || function(o) {
  if (o === Z.Object) { return Object.prototype; }
  return o.__z_proto__ || null;
};

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
  try { delete o[prop]; } catch (e) { o[prop] = undefined; }
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

Z.type = function(o) {
  if (o === null)      { return 'null'; }
  if (o === undefined) { return 'undefined'; }

  switch (toString.call(o)) {
    case '[object Array]'     : return 'array';
    case '[object Function]'  : return 'function';
    case '[object String]'    : return 'string';
    case '[object Number]'    : return 'number';
    case '[object Boolean]'   : return 'boolean';
    case '[object Date]'      : return 'date';
    case '[object RegExp]'    : return 'regexp';
    case '[object Object]'    : return o.isZObject ? 'zobject' : 'object';
    default:
      throw new Error(Z.fmt("Z.type: BUG: unknown type for %@", o));
  }
};

Z.isNull      = function(o) { return Z.type(o) === 'null'; };
Z.isUndefined = function(o) { return Z.type(o) === 'undefined'; };
Z.isArray     = function(o) { return Z.type(o) === 'array'; };
Z.isFunction  = function(o) { return Z.type(o) === 'function'; };
Z.isString    = function(o) { return Z.type(o) === 'string'; };
Z.isNumber    = function(o) { return Z.type(o) === 'number'; };
Z.isBoolean   = function(o) { return Z.type(o) === 'boolean'; };
Z.isDate      = function(o) { return Z.type(o) === 'date'; };
Z.isRegExp    = function(o) { return Z.type(o) === 'regexp'; };
Z.isObject    = function(o) { return Z.type(o) === 'object'; };
Z.isZObject   = function(o) { return Z.type(o) === 'zobject'; };
Z.isNaN       = function(o) { return o !== o; };

// Used to detect cases of recursion on the same pair of objects. Returns `true`
// if the given objects have already been seen. Otherwise the given function is
// called and `false` is returned.
//
// This function is used internally when traversing objects and arrays to avoid
// getting stuck in infinite loops when circular objects are encountered. It
// should be wrapped around all recursive function calls where a circular object
// may be encountered. See `Z.eq` for an example.
//
// * `o1` - The first object to check for recursion.
// * `o2` - The paired object to check for recursion (optional, defaults to
//          `undefined`).
// * `f`  - A function that make the recursive funciton call.
//
// Returns `true` if recursion on the given objects has been detected. If the
// given pair of objects has yet to be seen, calls `f` and returns `false`.
Z.detectRecursion = function(o1, o2, f) {
  var type = Z.type(o1);

  if (type !== 'object' && type !== 'array' && type !== 'zobject') {
    return false;
  }

  if (arguments.length === 2) { f = o2; o2 = undefined; }

  if (seen(o1, o2)) {
    return true;
  }
  else {
    mark(o1, o2);
    try { f(); } finally { unmark(o1, o2); }
    return false;
  }
};

// Similar to `Z.detectRecursion`, but short circuits all inner recursion levels
// using `throw`.
Z.detectOutermostRecursion = function(o1, o2, f) {
  if (arguments.length === 2) { f = o2; o2 = undefined; }

  if (detectOutermostRecursion) {
    if (Z.detectRecursion(o1, o2, f)) {
      throw InnerRecursionDetected;
    }

    return false;
  }
  else {
    try {
      detectOutermostRecursion = true;

      try {
        Z.detectRecursion(o1, o2, f);
      }
      catch (e) {
        if (e !== InnerRecursionDetected) { throw e; }
        return true;
      }
    }
    finally {
      detectOutermostRecursion = false;
    }
  }
};

function seen(o1, o2) {
  var i, len;

  for (i = 0, len = seenObjects.length; i < len; i++) {
    if (seenObjects[i][0] === o1 && seenObjects[i][1] === o2) {
      return true;
    }
  }

  return false;
}

function mark(o1, o2) {
  seenObjects.push([o1, o2]);
}

function unmark(o1, o2) {
  var i, len;

  for (i = 0, len = seenObjects.length; i < len; i++) {
    if (seenObjects[i][0] === o1 && seenObjects[i][1] === o2) {
      seenObjects.splice(i, 1);
      return;
    }
  }
}


}());
