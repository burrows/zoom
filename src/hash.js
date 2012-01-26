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

}());
