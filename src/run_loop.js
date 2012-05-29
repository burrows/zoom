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
  var self    = this,
      apps    = Z.A(),
      queue   = Z.Hash.create(function(h, k) { return h.at(k, Z.H()); }),
      timer   = null,
      running = false,
      keyEvents, mouseEvents;

  keyEvents = [
    'keydown',
    'keypress',
    'keyup'
  ];

  mouseEvents = [
    'click',
    'dblclick',
    'mousedown',
    'mouseup',
    'mouseover',
    'mousemove',
    'mouseout',
    'select'
  ];

  function run() {
    timer = null;

    // TODO: Z.Binding.flush();

    // notify all apps to display their windows if necessary
    apps.invoke('displayWindows');

    queue.each(function(tuple) {
      var o = tuple[0], methods = tuple[1];
      methods.keys().each(function(method) { o[method](); });
    });

    queue.clear();
  }

  function schedule() {
    if (self.isRunning() && !timer) { timer = setTimeout(run, 1); }
    return self;
  }

  function processKeyEvent(e) {
    apps.each(function(app) { app.dispatchKeyEvent(e); });
    schedule();
  }

  function processMouseEvent(e) {
    var view   = Z.View.viewForNode(e.target),
        window = view ? view.window() : null,
        app    = window ? window.app() : null;

    if (!app) { return; }

    app.dispatchMouseEvent(e);
    schedule();
  }

  function addKeyListeners() {
    var i, len;

    for (i = 0, len = keyEvents.length; i < len; i++) {
      document.addEventListener(keyEvents[i], processKeyEvent, false);
    }
  }

  function removeKeyListeners() {
    var i, len;

    for (i = 0, len = keyEvents.length; i < len; i++) {
      document.removeEventListener(keyEvents[i], processKeyEvent, false);
    }
  }

  function addMouseListeners(app) {
    var elem = app.container(), i, len;

    for (i = 0, len = mouseEvents.length; i < len; i++) {
      elem.addEventListener(mouseEvents[i], processMouseEvent, false);
    }
  }

  function removeMouseListeners(app) {
    var elem = app.container(), i, len;

    for (i = 0, len = mouseEvents.length; i < len; i++) {
      elem.removeEventListener(mouseEvents[i], processMouseEvent, false);
    }
  }

  function startListening() {
    addKeyListeners();
    apps.each(addMouseListeners);
  }

  function stopListening() {
    removeKeyListeners();
    apps.each(removeMouseListeners);
  }

  // Public: A boolean property indicating whether the run loop is currently
  // running.
  this.prop('isRunning', { def: false });

  // Public: Registers the given app with the run loop. When an app is
  // registered, the run loop will listen for mouse events on its container as
  // well as notify it to update its windows on all runs of the run loop.
  //
  // Returns the receiver.
  this.def('registerApp', function(app) {
    apps.push(app);
    if (this.isRunning()) { addMouseListeners(app); }
    return this;
  });

  // Public: Deregisters the given app with the run loop. The run loop will no
  // longer listen for events on the app's `container` nor notify it to update
  // its windows on runs of the run loop.
  this.def('deregisterApp', function(app) {
    if (this.isRunning()) { removeMouseListeners(app); }
    apps.remove(app);
    return this;
  });

  // Public: Starts the run loop. When started, the run loop listens for all
  // keyboard events and mouse events in each app's container and triggers a run
  // whenever an event occurs.
  //
  // Returns the receiver.
  this.def('start', function() {
    if (!this.isRunning()) {
      startListening();
      this.isRunning(true);
    }

    return this;
  });

  // Public: Stops the run loop, thereby stopping all event listeners. When
  // stopped, keyboard and mouse events will no longer trigger runs of the run
  // loop.
  //
  // Returns the receiver.
  this.def('stop', function() {
    if (this.isRunning()) {
      stopListening();
      this.isRunning(false);
    }

    return this;
  });

  // Public: Schedules a run of the run loop after a short timeout. Application
  // code should rarely ever need to invoke this method directly since runs of
  // the run loop are automatically scheduled when an event occurs or a method
  // is queued up with the `once` method.
  //
  // Returns nothing.
  this.def('schedule', schedule);

  // Public: Executes a single run of the run loop. This includes flushing
  // bindings, updating each app's windows, and executing any methods queued up
  // with the `once` method.
  //
  // Application code should rarely ever need to inoke this method directly
  // since it will be scheduled to be run by the run loop when an event occurs
  // or a method is queued by the `once` method.
  //
  // Returns nothing.
  this.def('run', run);

  // Public: Queues up a method to invoke on the given object at the end of the
  // current run loop. If the run loop is currently idle, it will be started.
  //
  // Returns nothing.
  this.def('once', function(o, m) { queue.at(o).at(m, true); schedule(); });
});

