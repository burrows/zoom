(function(undefined) {

Z.Hash = Z.Object.extend(Z.Enumerable, function() {
  this.def('initialize', function() {
    this.supr();
    this.__z_buckets__ = {};
    this.__z_size__ = 0;
  });

  this.property('size', {
    readonly: true,
    get: function() { return this.__z_size__; }
  });

  this.def('at', function(k, v) {
    var hash = Z.hash(k), bucket = this.__z_buckets__[hash], entry, i, len;

    if (arguments.length === 1) {
      if (!bucket) { return null; }

      for (i = 0, len = bucket.length; i < len; i++) {
        entry = bucket[i];
        if (Z.eq(k, entry.key)) { return entry.value; }
      }

      return null;
    }
    else {
      if (bucket) {
        for (i = 0, len = bucket.length; i < len; i++) {
          entry = bucket[i];
          if (Z.eq(k, entry.key)) {
            entry.value = v;
            return v;
          }
        }

        bucket.push({ key: k, value: v });
        this.__z_size__++;
      }
      else {
        this.__z_buckets__[hash] = [{ key: k, value: v }];
        this.__z_size__++;
      }

      return v;
    }
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
});

Z.hash = function(o) { return hash(o, []); };

// FIXME: This code is a bit buggy when it comes to recursive data structures
// (objects and arrays), see http://bugs.ruby-lang.org/issues/1448 for more
// info.
function hash(o, seen) {
  var type = typeof o, v, size, key, i, len;

  if (o === null) {
    return Z.murmur('null', 1);
  }
  else if (type === 'undefined') {
    return Z.murmur('undefined', 1);
  }
  else if (type === 'function' || type === 'number') {
    return Z.murmur(o.toString(), 1);
  }
  else if (type == 'string') {
    return Z.murmur(o, 1);
  }
  else if (o.isZObject) {
    return o.hash();
  }
  else if (Z.isArray(o)) {
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

}());
