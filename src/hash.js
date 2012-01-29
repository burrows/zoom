(function(undefined) {

var seed = Math.floor(Math.random() * 0xffffffff);

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

Z.hashSeed = function() { return seed; };

Z.hash = function(o) {
  var v, key, i, len;

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

}());
