Z.RunLoop = Z.Object.create().open(function() {
  var queue = Z.Hash.create(function(h, k) { return h.at(k, Z.H()); }),
      timer = null;

  this.def('toString', function() {
    return Z.fmt("#<Z.RunLoop:%@ running: %@>", this.objectId(), timer !== null);
  });

  function run() {
    timer = null;

    // TODO: Z.Binding.flush();

    queue.each(function(tuple) {
      var o = tuple[0], methods = tuple[1];
      methods.keys().each(function(method) { o[method](); });
    });

    queue.clear();
  }

  this.def('once', function(o, m) {
    queue.at(o).at(m, true);
    if (!timer) { timer = setTimeout(run, 1); }
  });
});

