(function(undefined) {

Z.Orderable = Z.Module.create(function() {
  this.isOrderable = true;

  this.def('cmp', function(other) {
    throw new Error('Z.Orderable.cmp: not implemented');
  });

  this.def('lt', function(other) {
    return this.cmp(other) < 0;
  });

  this.def('lte', function(other) {
    return this.cmp(other) <= 0;
  });

  this.def('gt', function(other) {
    return this.cmp(other) > 0;
  });

  this.def('gte', function(other) {
    return this.cmp(other) >= 0;
  });

  this.def('max', function(other) {
    return this.cmp(other) >= 0 ? this : other;
  });

  this.def('min', function(other) {
    return this.cmp(other) <= 0 ? this : other;
  });
});

Z.cmp = function(a, b) {
  if (a && a.isOrderable) { return a.cmp(b); }

  if (a < b) {
    return -1;
  }
  else if (a > b) {
    return 1;
  }
  else {
    return 0;
  }
};

Z.max = function(a, b) {
  return Z.cmp(a, b) >= 0 ? a : b;
};

Z.min = function(a, b) {
  return Z.cmp(a, b) <= 0 ? a : b;
};

}());