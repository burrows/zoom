// The `Z.RunLoop` singleton object is the mechanism that allows the execution
// of code to be deferred for a short amount of time until an application's data
// bindings have "stabilized".
//
// Zoom's KVO system operates synchronously, that is when a particular observed
// property is set, any objects observing that property are notified and have
// their handlers executed before the call to `Z.Object.set` returns. This is
// simple and straightforward, but could potentially lead to performance
// problems if relied upon to propagate data between an application's model,
// controller, and view layers. Instead, property bindings should be used to
// serve this purpose since they are flushed all at once, after the current
// thread of execution has completed. This means that if a property changes many
// times in a single thread of execution (say a `total` computed property that
// sums up a set of properties on associated objects that are all being updated)
// any other properties that are bound to it only get updated once.
//
// The fact that bindings are propagated this way has particular implications
// on the view layer. In the case of a DOM application, modifying the DOM is
// comparatively expensive to just about anything else the application will do.
// This means that we want to minimize touching the DOM as much as possible. The
// run loop allows us to do this by only redrawing views once, even when
// multiple views or multiple properties of a view have changed.
Z.RunLoop = Z.Object.create().open(function() {
  var queue = Z.Hash.create(function(h, k) { return h.at(k, Z.H()); }),
      timer = null;

  // Private: Competes a single run of the run loop by flushing all pending
  // bindings and executing any methods that were queued up with the `once`
  // method.
  function finish() {
    timer = null;

    // TODO: Z.Binding.flush();

    queue.each(function(tuple) {
      var o = tuple[0], methods = tuple[1];
      methods.keys().each(function(method) { o[method](); });
    });

    queue.clear();
  }

  // Public: Returns a simple string representation of the run loop. Only useful
  // for debugging purposes.
  this.def('toString', function() {
    return Z.fmt("#<Z.RunLoop:%@ running: %@>", this.objectId(), timer !== null);
  });

  // Public: Triggers the execution of the next run loop, but only if the run
  // loop is currently idle.
  //
  // Returns nothing.
  this.def('start', function() {
    if (!timer) { timer = setTimeout(finish, 1); }
  });

  // Public: Queues up a method to invoke on the given object at the end of the
  // current run loop. If the run loop is currently idle, it will be started.
  //
  // Returns nothing.
  this.def('once', function(o, m) {
    queue.at(o).at(m, true);
    this.start();
  });
});

