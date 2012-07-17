// The `Z.RunLoop` singleton object processes browser events by dispatching them
// to the appropriate `Z.App` object and triggers view displays when they occur.
//
// The Zoom view system is designed to buffer all DOM modifications -
// manipulating a view `subviews` array for instance does not actually make any
// immediate changes to the DOM structure the views are managing. The DOM is not
// updated until the `Z.View.display` method is later invoked. But when does the
// `display` method get invoked? That logic is handled by the run loop, it is
// responsible for triggering view displays when it observes an event (i.e. a
// mouse event, or an ajax request completing). The reason for this indirection
// is that manipulating the DOM is expensive and we want to avoid doing it as
// much as possible. We minimize interaction with the DOM by allowing changes to
// "batch up" and then update the DOM all in one go after an event (which
// triggered the view changes in the first place) has been fully processed.
Z.RunLoop = Z.Object.create().open(function() {
  var self = this, slice = Array.prototype.slice, apps, queue, ajaxSend;

  // Internal: The list of `Z.App` objects that are currently registered with
  // the run loop.
  apps = Z.A();

  // Internal: A hash of function objects queued up with the `once` method.
  queue = Z.Hash.create(function(h, k) { return h.at(k, Z.H()); });

  // Internal: Performs a single run of the run loop. This includes triggering
  // displays of each window as well as executing functions queued up with the
  // `once` method.
  function run() {
    // notify all apps to display their windows if necessary
    apps.invoke('displayWindows');

    queue.each(function(tuple) {
      var o = tuple[0], methods = tuple[1];
      methods.keys().each(function(method) { o[method](); });
    });

    queue.clear();
  }

  // Internal: The key event listener - each native key event is converted to a
  // `Z.Event` object and dispatched to each registered app.
  function processKeyEvent(e) {
    var event = Z.Event.fromNative(e);
    apps.each(function(app) { app.dispatchEvent(event); });
    run();
  }

  // Internal: The mouse event listener - each native key event is converted to
  // a `Z.Event` object and dispatched to the app over which the event occurred.
  function processMouseEvent(e) {
    var view = Z.View.forNode(e.target);

    if (!view) { return; }

    view.get('window.app').dispatchEvent(Z.Event.fromNative(e));
    run();
  }

  // Internal: Registers a mouse listener for the given app's `container` node.
  function addMouseListeners(app) {
    apps.each(function(app) {
      Z.Event.registerMouseListener(app.container(), processMouseEvent);
    });
  }

  // Internal: Deregisters the mouse listener for the given app's `container`
  // node.
  function removeMouseListeners(app) {
    apps.each(function(app) {
      Z.Event.deregisterMouseListener(app.container(), processMouseEvent);
    });
  }

  // Internal: Monkey patches `XMLHttpRequest.prototype.send` to trigger a run
  // loop every time an ajax request completes.
  function wrapAjaxRequests() {
    if (typeof XMLHttpRequest === 'undefined') { return; }

    ajaxSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.send = function() {
      var xhr = this, orig = this.onreadystatechange;

      this.onreadystatechange = function() {
        var state = xhr.readyState, r = orig();
        if (state === 4) { run(); }
        return r;
      };

      return ajaxSend.apply(this, slice.call(arguments));
    };
  }

  // Internal: Removes the `XMLHttpRequest.prototype.send` monkey patch.
  function unwrapAjaxRequests() {
    if (typeof XMLHttpRequest === 'undefined') { return; }
    XMLHttpRequest.prototype.send = ajaxSend;
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
      Z.Event.registerKeyListener(processKeyEvent);
      addMouseListeners();
      wrapAjaxRequests();
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
      Z.Event.deregisterKeyListener(processKeyEvent);
      removeMouseListeners();
      unwrapAjaxRequests();
      this.isRunning(false);
    }

    return this;
  });

  // Public: Executes a run of the run loop. This includes flushing bindings,
  // updating each app's windows, and executing any methods queued up with the
  // `once` method.
  //
  // Application code should rarely ever need to call this method directly since
  // it will be called automatically by the run loop whenever an event occurs.
  //
  // Returns nothing.
  this.def('run', run);

  // Public: Queues up a method to invoke on the given object at the end of the
  // next run loop.
  //
  // `o` - A `Z.Object` instance.
  // `m` - A string representing the method to invoke on `o`.
  //
  // Returns `o`.
  this.def('once', function(o, m) { queue.at(o).at(m, true); return o; });
});

