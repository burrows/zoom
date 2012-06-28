(function(undefined) {

var slice                    = Array.prototype.slice,
    toString                 = Object.prototype.toString,
    namespaces               = [ [Z, 'Z'] ],
    seenObjects              = [],
    InnerRecursionDetected   = {},
    detectOutermostRecursion = false;

// Internal: A simple test to see if a function is provided by the runtime.
function isNative(f) { return !!String(f).match(/\[native code\]/); }

// Internal: Polyfill for `Object.create`.
Z.create = isNative(Object.create) ? Object.create : function(o) {
  var F = function() {}, o2;
  F.prototype = o;
  o2 = new F();
  o2.constructor = F;
  return o2;
};

// Internal: Polyfill for `Object.getPrototypeOf`.
Z.getPrototypeOf = isNative(Object.getPrototypeOf) ? Object.getPrototypeOf : function(o) {
  return o.constructor ? o.constructor.prototype : null;
};

// Public: Registers a namespace for `Z.Object.typeName` to search through to
// determine the name of a type object. All of your application objects should
// be created under a namespace object instead of in the global scope.
// Registering those namespace objects will result in better debugging output.
//
// o    - The namespace object.
// name - A string containing the name of the namespace object (default: '').
//
// Examples
//
//   MyApp = {};
//   MyApp.MyModel = Z.Object.extend();
//   MyApp.MyModel.create();            // => #<(Unknown):18>
//   Z.addNamespace(MyApp, 'MyApp');
//   MyApp.MyModel.create();            // => #<MyApp.MyModel:19>
//
// Returns nothing.
Z.addNamespace = function(o, name) { namespaces.push([o, name || '']); };

// Public: Deregisters a namespace object. Deregistered namespace objects will
// no longer be searched for type objects.
//
// o - The namespace object to remove.
//
// Returns nothing.
Z.removeNamespace = function(o) {
  namespaces = Z.Array.create(namespaces).remove(o).toNative();
};

// Internal: Returns a native array of all currently registered namespace
// objects.
Z.namespaces = function() { return slice.call(namespaces); };

// Internal: Used by `detectRecursion` to check to see if the given pair of
// objects has been encountered yet on a previous recursive call.
//
// o1 - The first object to check for recursion.
// o2 - The paired object to check for recursion.
//
// Returns `true` if the pair has been seen previously and `false` otherwise.
function seen(o1, o2) {
  var i, len;

  for (i = 0, len = seenObjects.length; i < len; i++) {
    if (seenObjects[i][0] === o1 && seenObjects[i][1] === o2) {
      return true;
    }
  }

  return false;
}

// Internal: Used by `detectRecursion` to mark the given pair of objects as seen
// before recursing.
//
// o1 - The first object to mark.
// o2 - The paired object to mark.
//
// Returns nothing.
function mark(o1, o2) { seenObjects.push([o1, o2]); }

// Internal: Used by `detectRecursion` to unmark the given pair of objects after
// a recursive call has completed.
//
// o1 - The first object to unmark.
// o2 - The paired object to unmark.
//
// Returns nothing.
function unmark(o1, o2) {
  var i, len;

  for (i = 0, len = seenObjects.length; i < len; i++) {
    if (seenObjects[i][0] === o1 && seenObjects[i][1] === o2) {
      seenObjects.splice(i, 1);
      return;
    }
  }
}

// Public: The identity function, simply returns its first argument.
//
// x - Any value.
//
// Returns `x`.
Z.identity = function(x) { return x; };

// Public: Copies all of the properties in the source objects over to the
// destination object. The sources are processed in order, so subsequent sources
// will override properties of the same name in previous sources.
//
// o       - The destination object.
// sources - One or more source objects.
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

// Public: Takes a native javascript object and merges in properties from a list
// of default objects if they are not already present in the first object.
//
// o           - The object to merge default values into
// defaults... - One or more objects that contain default values.
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

// Public: Creates a shallow copy of the given object.
//
// o - Any object.
//
// Returns a new object with all of the keys copied from `o`.
Z.dup = function(o) { return Z.merge({}, o); };

// Public: Deletes a property from an object and returns its value.
//
// o    - Any object.
// prop - The property to delete.
//
// Returns the value of the given property name.
Z.del = function(o, prop) {
  var val = o[prop];
  try { delete o[prop]; } catch (e) { o[prop] = undefined; }
  return val;
};

// Public: Formats the given string by replacing instances of "%@" with the
// corresponding item from `vals` converted to a string using the item's
// `toString` method.
//
// Examples
//
//   Z.fmt("the array size is %@", Z.A(1,2).size()) // => "the array size is 3"
//
// s     - The string to format.
// *vals - Zero or more values to insert into the string. The number of values
//         given should be equal to the number of occurences of the string
//         `"%@"` in `s`.
//
// Returns the formatted string.
Z.fmt = function(s) {
  var vals = slice.call(arguments, 1), i = 0;

  return s.replace(/%@/g, function(m) {
    var val = vals[i++];
    return val !== undefined && val !== null ? val.toString() : '';
  });
};

// Public: Converts the given object to a string.
//
// o - The object to convert to a string.
//
// Returns a string representation of the given object.
Z.inspect = function(o) {
  var a, recursed;

  switch (Z.type(o)) {
    case 'null':
      return 'null';
    case 'undefined':
      return 'undefined';
    case 'function':
      return '[Function]';
    case 'string':
      return "'" + o + "'";
    case 'array':
    case 'arguments':
      if (o.length === 0) { return '[]'; }

      a = [];

      recursed = Z.detectRecursion(o, function() {
        var i, len;
        for (i = 0, len = o.length; i < len; i++) { a.push(Z.inspect(o[i])); }
      });

      return recursed ? '[...]' : '[' + a.join(', ') + ']';
    case 'domelem':
      a = [];

      if (o.id && o.id.length > 0) {
        a.push(Z.fmt('id="%@"', o.id));
      }

      if (o.className && o.className.length > 0) {
        a.push(Z.fmt('class="%@"', o.className));
      }
      return Z.fmt("<%@%@ />", o.nodeName.toLowerCase(),
                   a.length > 0 ? ' ' + a.join(' ') : '');

    case 'object':
      a = [];

      recursed = Z.detectRecursion(o, function() {
        var k;
        for (k in o) {
          if (!o.hasOwnProperty(k)) { continue; }
          a.push(k + ': ' + Z.inspect(o[k]));
        }
      });

      return recursed ? '{...}' : '{' + a.join(', ') + '}';
    default:
      return o.toString();
  }
};

// Public: Performs an object equality test. If the first argument is a
// `Z.Object` then it is sent the `eq` method, otherwise custom equality code is
// run based on the object type.
//
// a - Any object.
// b - Any object.
//
// Returns `true` if the objects are equal and `false` otherwise.
Z.eq = function(a, b) {
  var atype, btype, akeys, bkeys, r;

  // identical objects are equal
  if (a === b) { return true; }

  atype = Z.type(a);

  // if the first argument is a Z.Object, delegate to its `eq` method
  if (atype === 'zobject') { return a.eq(b); }

  btype = Z.type(b);

  // native objects that are not of the same type are not equal
  if (atype !== btype) { return false; }

  switch (atype) {
    case 'boolean':
    case 'string':
    case 'date':
    case 'number':
      return a.valueOf() === b.valueOf();
    case 'regexp':
      return a.source     === b.source    &&
             a.global     === b.global    &&
             a.multiline  === b.multiline &&
             a.ignoreCase === b.ignoreCase;
    case 'array':
      if (a.length !== b.length) { return false; }

      r = true;

      Z.detectRecursion(a, b, function() {
        var i, len;

        for (i = 0, len = a.length; i < len; i++) {
          if (!Z.eq(a[i], b[i])) { r = false; break; }
        }
      });

      return r;
    case 'object':
      akeys = Z.H(a).keys().toNative();
      bkeys = Z.H(b).keys().toNative();

      if (akeys.length !== bkeys.length) { return false; }

      r = true;

      Z.detectRecursion(a, b, function() {
        var i, len, key;

        for (i = 0, len = akeys.length; i < len; i++) {
          key = akeys[i];
          if (!b.hasOwnProperty(key)) { r = false; break; }
          if (!Z.eq(a[key], b[key])) { r = false; break; }
        }
      });

      return r;
    default:
      return false;
  }
};

// Internal: Calculates a [murmur hash](http://sites.google.com/site/murmurhash)
// of the given string. This function is used by `Z.hash` to generate hash
// values for any type of javascript object.
//
// This code is borrowed from https://github.com/garycourt/murmurhash-js.
//
// key  - A string to calculate the hash of.
// seed - An integer to seed the hash with.
//
// Returns a non-cryptographic 32-bit hash of `key`.
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

// Public: Returns a string indicating the type of the given object. This can be
// considered an enhanced version of the javascript `typeof` operator.
//
// Examples
//
//   Z.type([])                // => 'array'
//   Z.type({})                // => 'object'
//   Z.type(9)                 // => 'number'
//   Z.type(/fo*/)             // => 'regexp'
//   Z.type(new Date)          // => 'date'
//   Z.type(Z.Object.create()) // => 'zobject'
//
// o1 - The object to get the type of.
//
// Returns a string indicating the object's type.
Z.type = function(o) {
  if (o === null)      { return 'null'; }
  if (o === undefined) { return 'undefined'; }

  switch (toString.call(o)) {
    case '[object Array]'     : return 'array';
    case '[object Arguments]' : return 'arguments';
    case '[object Function]'  : return 'function';
    case '[object String]'    : return 'string';
    case '[object Number]'    : return 'number';
    case '[object Boolean]'   : return 'boolean';
    case '[object Date]'      : return 'date';
    case '[object RegExp]'    : return 'regexp';
    case '[object Object]'    :
      if (o.hasOwnProperty('callee')) { return 'arguments'; } // ie fallback
      else if (o.nodeType === 1) { return 'domelem'; }        // domino hack
      else { return o.isZObject === true ? 'zobject' : 'object'; }
      break;
    default:
      return o.nodeType === 1 ? 'domelem' : 'unknown';
  }
};

// Public: Indicates whether the given object is `null`.
Z.isNull      = function(o) { return Z.type(o) === 'null'; };

// Public: Indicates whether the given object is `undefined`.
Z.isUndefined = function(o) { return Z.type(o) === 'undefined'; };

// Public: Indicates whether the given object is a native array.
Z.isArray     = function(o) { return Z.type(o) === 'array'; };

// Public: Indicates whether the given object is an `Arguments` object.
Z.isArguments = function(o) { return Z.type(o) === 'arguments'; };

// Public: Indicates whether the given object is a `Function` object.
Z.isFunction  = function(o) { return Z.type(o) === 'function'; };

// Public: Indicates whether the given object is a `String`.
Z.isString    = function(o) { return Z.type(o) === 'string'; };

// Public: Indicates whether the given object is a `Number`.
Z.isNumber    = function(o) { return Z.type(o) === 'number'; };

// Public: Indicates whether the given object is a `Boolean`.
Z.isBoolean   = function(o) { return Z.type(o) === 'boolean'; };

// Public: Indicates whether the given object is a `Date`.
Z.isDate      = function(o) { return Z.type(o) === 'date'; };

// Public: Indicates whether the given object is a `RegExp`.
Z.isRegExp    = function(o) { return Z.type(o) === 'regexp'; };

// Public: Indicates whether the given object is an `Object`.
Z.isObject    = function(o) { return Z.type(o) === 'object'; };

// Public: Indicates whether the given object is a `Z.Object`.
Z.isZObject   = function(o) { return Z.type(o) === 'zobject'; };

// Public: Indicates whether the given object is a `NaN`.
Z.isNaN       = function(o) { return o !== o; };

// Public: Indicates whether the first argument is a descendant of the second.
// This simply calls the `isA` method on the first argument if it is a
// `Z.Object`. This is useful in cases where the object you are checking may be
// null or some object outside of the `Z.Object` hierarchy.
//
// o    - The object to check.
// type - The type to check the first argument against. This doesn't have to be
//        a type object (though that is likey the most common case), it can be a
//        concrete instance as well.
//
// Returns `true` if the object is a descendant of the type and `false`
//   otherwise.
Z.isA = function(o, type) { return !!(o && o.isZObject && o.isA(type)); };

// Internal: Used to detect cases of recursion on the same pair of objects.
// Returns `true` if the given objects have already been seen. Otherwise the
// given function is called and `false` is returned.
//
// This function is used internally when traversing objects and arrays to avoid
// getting stuck in infinite loops when circular objects are encountered. It
// should be wrapped around all recursive function calls where a circular object
// may be encountered. See `Z.eq` for an example.
//
// o1 - The first object to check for recursion.
// o2 - The paired object to check for recursion (default: `undefined`).
// f  - A function that make the recursive funciton call.
//
// Returns `true` if recursion on the given objects has been detected. If the
//   given pair of objects has yet to be seen, calls `f` and returns `false`.
Z.detectRecursion = function(o1, o2, f) {
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

// Internal: Similar to `Z.detectRecursion`, but short circuits all inner
// recursion levels using `throw`.
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

// Public: Resolves a path into an actual object reference. The path is assumed
// to be relative to the given context object or the global object if a context
// is not given.
//
// path - A string containing the path to resolve.
// ctx  - The object to resolve the path from.
//
// Returns the resolved object or `undefined` if it doesn't exist.
Z.resolve = function(path, ctx) {
  var head, tail;

  ctx  = ctx || Z.global;

  if (ctx.isZObject) { return ctx.get(path); }

  path = path.split('.');
  head = path[0];
  tail = path.slice(1);

  if (tail.length === 0) { return ctx[head]; }

  return ctx[head] ? Z.resolve(tail.join('.'), ctx[head]) : undefined;
};

// Public: Converts each argument to a string using `Z.inspect` and logs it to
// the console.
//
// *args - One or more values to log.
//
// Returns nothing.
Z.log = function() {
  var a = [], i, len;

  if (!console) { return; }

  for (i = 0, len = arguments.length; i < len; i++) {
    a.push(Z.inspect(arguments[i]));
  }

  console.log(a.join(' '));
};

}());

