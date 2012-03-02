(function(undefined) {

var seed = Math.floor(Math.random() * 0xffffffff);

Z.Hash = Z.Object.extend(Z.Enumerable, function() {
  this.isZHash = true;

  function defaultValue(h, k) {
    var def = h.__z_default__;
    return typeof def === 'function' ? def.call(null, h, k) : def;
  }

  this.def('initialize', function(def) {
    var nargs = arguments.length;

    if (nargs > 1) {
      throw new Error(Z.fmt("Z.Hash.initialize: given %@ arguments, expected 0 or 1", nargs));
    }

    this.supr();
    this.__z_buckets__ = {};
    this.__z_size__    = 0;
    this.__z_default__ = nargs === 1 ? def : null;
  });

  this.property('size', {
    readonly: true, get: function() { return this.__z_size__; }
  });

  this.property('@', { readonly: true, get: function() { return this; } });

  this.def('at', function(k, v) {
    var nargs = arguments.length, hash, bucket, entry, i, len;

    if (nargs < 1 || nargs > 2) {
      throw new Error(Z.fmt("Z.Hash.at: given %@ arguments, expected 1 or 2", nargs));
    }

    hash   = Z.hash(k);
    bucket = this.__z_buckets__[hash];

    if (nargs === 1) {
      if (!bucket) { return defaultValue(this, k); }

      for (i = 0, len = bucket.length; i < len; i++) {
        entry = bucket[i];
        if (Z.eq(k, entry.key)) { return entry.value; }
      }

      return defaultValue(this, k);
    }
    else {
      if (bucket) {
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
        bucket.push({ key: k, value: v });
        this.__z_size__++;
        this.didChangeProperty(k);
        this.didChangeProperty('size');
        this.didChangeProperty('@', {type: 'insert', key: k, current: v});
      }
      else {
        this.willChangeProperty(k);
        this.willChangeProperty('size');
        this.willChangeProperty('@', {type: 'insert', key: k, previous: null});
        this.__z_buckets__[hash] = [{ key: k, value: v }];
        this.__z_size__++;
        this.didChangeProperty(k);
        this.didChangeProperty('size');
        this.didChangeProperty('@', {type: 'insert', key: k, current: v});
      }

      return v;
    }
  });

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

  this.def('clear', function() {
    var self = this;
    this.keys().each(function(k) { self.del(k); });
    return this;
  });

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

  this.def('toString', function() {
    var self = this, a, recursed;

    if (this.isPrototype) { return this.supr(); }

    recursed = Z.detectRecursion(this, function() {
      a = self.map(function(k, v) {
        return Z.inspect(k) + ': ' + Z.inspect(v);
      });
    });

    return Z.fmt("#<%@:%@ {%@}>", this.prototypeName(), this.objectId(),
                 recursed ? '...' : a.join(', '));
  });

  this.def('each', function(f) {
    var buckets = this.__z_buckets__, hash, bucket, i, len;

    for (hash in buckets) {
      if (!buckets.hasOwnProperty(hash)) { continue; }

      bucket = buckets[hash];

      for (i = 0, len = bucket.length; i < len; i++) {
        f(bucket[i].key, bucket[i].value);
      }
    }

    return this;
  });

  this.def('keys', function() {
    return this.map(function(k, v) { return k; });
  });

  this.def('values', function() {
    return this.map(function(k, v) { return v; });
  });

  this.def('hash', function() {
    var self = this, val = this.__z_size__;

    Z.detectOutermostRecursion(this, function() {
      self.each(function(k, v) {
        val ^= Z.hash(k);
        val ^= Z.hash(v);
      });
    });

    return val;
  });

  this.def('eq', function(other) {
    var self = this, size = this.__z_size__, r = true, keys;

    if (Z.type(other) !== 'zobject' || !other.isZHash) { return false; }
    if (size !== other.__z_size__) { return false; }

    keys = this.keys();

    Z.detectRecursion(this, other, function() {
      var key, i;

      for (i = 0; i < size; i++) {
        key = keys.at(i);
        if (!other.hasKey(key)) { r = false; break; }
        if (!Z.eq(self.at(key), other.at(key))) { r = false; break; }
      }
    });

    return r;
  });

  this.def('getUnknownProperty', function(k) {
    return this.at(k);
  });

  this.def('setUnknownProperty', function(k, v) {
    return this.at(k, v);
  });

  this.def('hasProperty', function() { return true; });
});

Z.hashSeed = function() { return seed; };

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
