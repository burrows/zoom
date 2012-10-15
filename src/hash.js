(function(undefined) {

var seed = Math.floor(Math.random() * 0xffffffff);

// The `Z.Hash` type provides a full blown hash table implementation that is KVC
// and KVO compliant. Any objects (those inheriting from `Z.Object` as well as
// native objects) can be used as keys in the hash. `Z.Hash` overrides the
// `getUnknownProperty` and `setUnknownProperty` methods to support getting and
// setting arbitrarily named properties. This means that you can work with
// properties on a hash without defining them first. Finally, `Z.Hash` also
// supports an `@` property similar to `Z.Array.@` that allows for observing
// mutations made to the hash.
//
// Examples
//
//   // Creating and manipulating hashes
//   var h = Z.Hash.create();
//
//   h.at('foo', 'string key');               // => 'string key'
//   h.at({x: 1}, 'object key');              // => 'object key'
//   h.at(/xy+z$/, 'regex key');              // => 'regex key'
//   h.at(Z.Object.create(), 'Z object key'); // => 'Z object key'
//   h                                        // => #<Z.Hash:17 {'foo': 'string key', {x: 1}: 'object key', /xy+z$/: 'regex key', #<Z.Object:19>: 'Z object key'}>
//   h.at('foo');                             // => 'string key'
//   h.at({x: 1});                            // => 'object key'
//   h.at(new RegExp('xy+z$'));               // => 'regex key'
//
//   // Default key values
//   var h = Z.Hash.create(9);
//
//   h.at('foo');     // => 9
//   h.at('foo', 10); // => 10
//   h.at('foo');     // => 10
//
//   var h = Z.Hash.create(function(h, k) { return h.at(k, []); });
//
//   h.at('foo').push('hello');
//   h.at('bar').push('goodbye');
//   h                            // => #<Z.Hash:29 {'foo': ['hello'], 'bar': ['goodbye']}>
//
//   // KVC/KVO support
//   var h = Z.H('foo', 9, 'bar', 22);
//
//   h.get('size'); // => 2
//   h.get('foo');  // => 9
//   h.get('bar');  // => 22
//
//   h.observe('size', null, Z.log);
//   h.observe('foo', null, Z.log);
//
//   h.at('baz', 1);
//   // {type: 'change', path: 'size', observee: #<Z.Hash:40 {'foo': 9, 'bar': 22, 'baz': 1}>}
//
//   h.at('foo', 10);
//   // {type: 'change', path: 'foo', observee: #<Z.Hash:40 {'foo': 10, 'bar': 22, 'baz': 1}>}
//
//   // Observing mutations with the @ property
//   var h = Z.H('foo', 9, 'bar', 22);
//
//   h.observe('@', null, Z.log, { previous: true, current: true });
//
//   h.at('foo', 10);
//   // {type: 'update', path: '@', observee: #<Z.Hash:58 {'foo': 10, 'bar': 22}>, previous: 9, current: 10, key: 'foo'}
//
//   h.set('bar', 23);
//   // {type: 'update', path: '@', observee: #<Z.Hash:58 {'foo': 10, 'bar': 23}>, previous: 22, current: 23, key: 'bar'}
//
//   h.del('foo');
//   // {type: 'remove', path: '@', observee: #<Z.Hash:58 {'bar': 23}>, previous: 10, current: null, key: 'foo'}
//
//   h.at('x', 'y');
//   // {type: 'insert', path: '@', observee: #<Z.Hash:58 {'bar': 23, 'x': 'y'}>, previous: null, current: 'y', key: 'x'}
Z.Hash = Z.Object.extend(Z.Enumerable, function() {
  // Internal: Returns the default value for a key that is not present in the
  // hash.
  //
  // k - The key to retrieve the default value for.
  //
  // Returns the default value for the key.
  function defaultValue(k) {
    var def = this.__z_default__;
    return typeof def === 'function' ? def.call(null, this, k) : def;
  }

  // Public: The `Z.Hash` constructor. Hashes support returning a default value
  // when a key is accessed that is not currently present in the hash. By
  // default, `null` is returned for unknown keys, but that can be customized
  // by passing a default value to the constructor or a function to be invoked
  // when an unknown key is accessed.
  //
  // def - The default value to return for unknown keys (default: `null`). This
  //       can be any object or a function. When given a function, that function
  //       is invoked each time an unknown key is accessed and is passed a
  //       reference to the hash itself as well as the key.
  this.def('init', function(def) {
    var nargs = arguments.length;

    if (nargs > 1) {
      throw new Error(Z.fmt("Z.Hash.init: given %@ arguments, expected 0 or 1", nargs));
    }

    this.__z_head__    = null;
    this.__z_tail__    = null;
    this.__z_buckets__ = {};
    this.__z_size__    = 0;
    this.__z_default__ = nargs === 1 ? def : null;
  });

  // Public: A property that returns the current size of the hash. This property
  // is readonly.
  this.prop('size', {
    readonly: true, get: function() { return this.__z_size__; }
  });

  // Public: A special readonly property that only exists for observing hash
  // mutations. Observing this property will cause notifications to be sent
  // every time a mutation is made to the hash. The `type` key in the
  // notification objects will be set to one of the following: `insert`,
  // `remove`, or `update`.
  this.prop('@', { readonly: true, get: function() { return this; } });

  // Public: Hash reference and assignment method. When given just a key
  // argument, it returns the current value for the key. When given a key and
  // value arguments, it sets the value for the given key.
  //
  // This method will trigger the appropriate property notifications to be sent
  // when setting keys.
  //
  // k - The key to get or set.
  // v - The value to set for the given key. When not given, the current value
  //     for `k` is returned.
  //
  // Returns the current value for `k` when given one argument, and returns `v`
  //   when given two arguments.
  // Throws `Error` when given the wrong number of arguments.
  this.def('at', function(k, v) {
    var nargs = arguments.length, hash, bucket, entry, i, len;

    if (nargs < 1 || nargs > 2) {
      throw new Error(Z.fmt("Z.Hash.at: given %@ arguments, expected 1 or 2", nargs));
    }

    hash   = Z.hash(k);
    bucket = this.__z_buckets__[hash];

    if (nargs === 1) {
      if (!bucket) { return defaultValue.call(this, k); }

      for (i = 0, len = bucket.length; i < len; i++) {
        entry = bucket[i];
        if (Z.eq(k, entry.key)) { return entry.value; }
      }

      return defaultValue.call(this, k);
    }
    else {
      if (!bucket) { bucket = this.__z_buckets__[hash] = []; }

      for (i = 0, len = bucket.length; i < len; i++) {
        entry = bucket[i];
        if (Z.eq(k, entry.key)) {
          this.willChangeProperty(k);
          this.willChangeProperty('@', {type: 'update', key: k, previous: entry.value});
          entry.value = v;
          this.didChangeProperty(k);
          this.didChangeProperty('@', {type: 'update', key: k, current: v});
          return v;
        }
      }

      this.willChangeProperty(k);
      this.willChangeProperty('size');
      this.willChangeProperty('@', {type: 'insert', key: k, previous: null});

      entry = { key: k, value: v, prev: this.__z_tail__, next: null };

      if (this.__z_tail__) { this.__z_tail__.next = entry;  }
      this.__z_tail__ = entry;

      if (!this.__z_head__) { this.__z_head__ = entry; }

      bucket.push(entry);
      this.__z_size__++;

      this.didChangeProperty(k);
      this.didChangeProperty('size');
      this.didChangeProperty('@', {type: 'insert', key: k, current: v});

      return v;
    }
  });

  // Public: Deletes a key/value pair from the hash.
  //
  // This method will trigger the appropriate property notifications to be sent.
  //
  // k - The key to delete from the hash.
  //
  // Returns `null`.
  // Throws `Error` when given the wrong number of arguments.
  this.def('del', function(k) {
    var hash, bucket, entry, i, len;

    if (arguments.length !== 1) {
      throw new Error(Z.fmt("Z.Hash.del: given %@ arguments, expected 1", arguments.length));
    }

    hash   = Z.hash(k);
    bucket = this.__z_buckets__[hash];

    if (!bucket) { return null; }

    for (i = 0, len = bucket.length; i < len; i++) {
      entry = bucket[i];
      if (Z.eq(k, entry.key)) {
        this.willChangeProperty(k);
        this.willChangeProperty('size');
        this.willChangeProperty('@', {type: 'remove', key: k, previous: entry.value});
        if (this.__z_head__ === entry) { this.__z_head__ = entry.next; }
        if (this.__z_tail__ === entry) { this.__z_tail__ = entry.prev; }
        if (entry.prev) { entry.prev.next = entry.next; }
        if (entry.next) { entry.next.prev = entry.prev; }
        bucket.splice(i, 1);
        this.__z_size__--;
        this.didChangeProperty(k);
        this.didChangeProperty('size');
        this.didChangeProperty('@', {type: 'remove', key: k, current: null});
        return entry.value;
      }
    }

    return null;
  });

  // Public: Deletes all key/value pairs from the hash.
  //
  // Returns the receiver.
  this.def('clear', function() {
    var self = this;
    this.keys().each(function(k) { self.del(k); });
    return this;
  });

  // Public: Indicates whether or not the given key is currently present in the
  // hash.
  //
  // k - The key object to check for.
  //
  // Returns `true` if the key is in the hash and `false` otherwise.
  // Throws `Error` if given the wrong number of arguments.
  this.def('hasKey', function(k) {
    var bucket, i, len;

    if (arguments.length !== 1) {
      throw new Error(Z.fmt("Z.Hash.hasKey: given %@ arguments, expected 1", arguments.length));
    }

    if ((bucket = this.__z_buckets__[Z.hash(k)])) {
      for (i = 0, len = bucket.length; i < len; i++) {
        if (Z.eq(k, bucket[i].key)) { return true; }
      }
    }

    return false;
  });

  // Public: Returns a string representation of the hash.
  this.def('toString', function() {
    var self = this, a, recursed;

    if (this.isType) { return this.supr(); }

    recursed = Z.detectRecursion(this, function() {
      a = self.map(function(tuple) {
        return Z.inspect(tuple[0]) + ': ' + Z.inspect(tuple[1]);
      });
    });

    return Z.fmt("#<%@:%@ {%@}>", this.typeName(), this.objectId(),
                 recursed ? '...' : a.join(', '));
  });

  // Public: The `Z.Hash` iterator, invokes the given function once for each
  // key/value pair in the hash.
  //
  // `Z.Hash` objects keep track of their insertion order, so iterating over a
  // hash using this method will always visit the key/value pairs in the order
  // in which they were inserted into the hash.
  //
  // f - A function object, it will be invoked once for each key/value pair in
  //     the hash. It will be passed a two element array containing the key at
  //     index 0 and the value at index 1.
  //
  // Returns the receiver.
  this.def('each', function(f) {
    var entry = this.__z_head__;

    while (entry) {
      f([entry.key, entry.value]);
      entry = entry.next;
    }

    return this;
  });

  // Public: Returns a `Z.Array` containing all of the keys in the hash.
  this.def('keys', function() {
    return this.map(function(tuple) { return tuple[0]; });
  });

  // Public: Returns a `Z.Array` containing all of the values in the hash.
  this.def('values', function() {
    return this.map(function(tuple) { return tuple[1]; });
  });

  // Public: Generates a hash value for the hash.
  this.def('hash', function() {
    var self = this, val = this.__z_size__;

    if (this.isType) { return this.supr(); }

    Z.detectOutermostRecursion(this, function() {
      self.each(function(tuple) {
        val ^= Z.hash(tuple[0]);
        val ^= Z.hash(tuple[1]);
      });
    });

    return val;
  });

  // Public: `Z.Hash` equality test. Hashes are equal if they contain the same
  // number of keys and if each key/value pair is equal (according to `Z.eq`) to
  // the corresponding elements in the other hash.
  //
  // other - A `Z.Hash` to compare to the receiver.
  //
  // Returns `true` if the hashes are equal and `false` otherwise.
  this.def('eq', function(other) {
    var self = this, size = this.__z_size__, r = true, keys;

    if (!Z.isA(other, Z.Hash) || size !== other.__z_size__) { return false; }

    keys = this.keys();

    Z.detectRecursion(this, other, function() {
      var key, i;

      for (i = 0; i < size; i++) {
        key = keys.at(i);
        if (!other.hasKey(key) || !Z.eq(self.at(key), other.at(key))) {
          r = false;
          return;
        }
      }
    });

    return r;
  });

  // Public: Converts the `Z.Hash` object to a native javascript object. The
  // keys in the native object will be the `toString` representation of key hash
  // key objects.
  //
  // Returns a native object.
  this.def('toNative', function() {
    return this.inject({}, function(acc, tuple) {
      acc[tuple[0] ? tuple[0].toString() : ''] = tuple[1];
      return acc;
    });
  });

  // Internal: Overrides the default `getUnknownProperty` implementation to
  // convert gets of unknown keys to simple hash references.
  //
  // k - The name of the unknown property.
  //
  // Returns the current value for the given key.
  this.def('getUnknownProperty', function(k) {
    return this.at(k);
  });

  // Internal: Overrides the default `setUnknownProperty` implementation to
  // convert sets of unknown keys to simple hash assignments.
  //
  // k - The name of the unknown property.
  // v - The value being set.
  //
  // Returns `v`.
  this.def('setUnknownProperty', function(k, v) {
    return this.at(k, v);
  });

  // Internal: Overrides the default `hasProperty` to unconditionally return
  // `true`. This allows observers to be attached to any arbitrary key on the
  // hash.
  this.def('hasProperty', function() { return true; });
});

// Public: Generates a hash value for any object, including native objects.
// This function is used by `Z.Hash.at` to hash key values for inserting and
// looking up keys. Objects that are equal according to `Z.eq` are guaranteed to
// return identical hash values.
//
// o - The object to generate a hash value for.
//
// Returns a number.
Z.hash = function(o) {
  var v;

  switch (Z.type(o)) {
    case 'null':
      return Z.murmur('null', seed);
    case 'undefined':
      return Z.murmur('undefined', seed);
    case 'function':
    case 'number':
    case 'boolean':
      return Z.murmur(o.toString(), seed);
    case 'string':
      return Z.murmur(o, seed);
    case 'date':
      return Z.murmur(o.valueOf().toString(), seed);
    case 'regexp':
      v = '/' + o.source + '/';

      if (o.global)     { v += 'g'; }
      if (o.ignoreCase) { v += 'i'; }
      if (o.multiline)  { v += 'm'; }

      return Z.murmur(v, seed);
    case 'array':
    case 'arguments':
      v = o.length;

      Z.detectOutermostRecursion(o, function() {
        var i, len;
        for (i = 0, len = o.length; i < len; i++) {
          v = ((v & 0x7fffffff) << 1) ^ Z.hash(o[i]);
        }
      });

      return v;
    case 'object':
      v = 0;

      Z.detectOutermostRecursion(o, function() {
        var key, size = 0;

        for (key in o) {
          if (!o.hasOwnProperty(key)) { continue; }
          size++;
          v ^= Z.hash(key);
          v ^= Z.hash(o[key]);
        }

        v ^= size;
      });

      return v;
    case 'zobject':
      return o.hash();
  }
};

// Public: A shortcut for constructing `Z.Hash` concrete instances from a list
// of key/value pairs or a native object. When given an even number of
// arguments, each odd argument is treated as a key and each odd argument the
// corresponding value. If given a single native object argument, each key/value
// pair in the native object are inserted into the hash.
//
// *args - Either a single native object or an even number of objects.
//
// Examples
//
//   Z.H({foo: 1, bar: 2});          // => #<Z.Hash:17 {'foo': 1, 'bar': 2}>
//   Z.H('foo', 1, {x: 'hello'}, 2); // => #<Z.Hash:21 {'foo': 1, {x: 'hello'}: 2}>
//
// Returns the new `Z.Hash` object.
// Throws `Error` when given an incorrect number of arguments
Z.H = function() {
  var len = arguments.length, h, k, i;

  if (len === 1 && Z.isObject(arguments[0])) {
    h = Z.Hash.create();

    for (k in arguments[0]) {
      if (!arguments[0].hasOwnProperty(k)) { continue; }
      h.at(k, arguments[0][k]);
    }

    return h;
  }
  else if (len % 2 === 0) {
    h = Z.Hash.create();

    for (i = 0; i < len; i += 2) {
      h.at(arguments[i], arguments[i+1]);
    }

    return h;
  }
  else {
    throw new Error(Z.fmt("Z.H: given %@ arguments, expected 1 plain object or an even number of arguments", len));
  }
};

}());

