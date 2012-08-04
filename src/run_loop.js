// The `Z.RunLoop` type provides an object that listens for events (key events,
// mouse events, and ajax events), dispatches them to the `Z.App` object it
// belongs to, and triggers view displays.
//
// The Zoom view system is designed to buffer all DOM modifications -
// manipulating a view `subviews` array for instance does not actually make any
// immediate changes to the DOM structure the views are managing. The DOM is not
// updated until the `Z.View.display` method is later invoked. But when does the
// `display` method get invoked? That logic is handled by the app's run loop, it
// is responsible for triggering view displays when it observes an event (i.e. a
// mouse event, or an ajax request completing). The reason for this indirection
// is that manipulating the DOM is expensive and we want to avoid doing it as
// much as possible. We minimize interaction with the DOM by allowing changes to
// "batch up" and then update the DOM all in one go after an event (which
// triggered the view changes in the first place) has been fully processed.
Z.RunLoop = Z.Object.extend(function() {
  var slice = Array.prototype.slice, keyEvents, mouseEvents;

  // Internal: List of native key events that the run loop listens for.
  keyEvents = ['keydown', 'keyup'];

  // Internal: List of native mouse events that the run loop listens for.
  mouseEvents = ['mousemove', 'mousedown', 'mouseup'];

  // Internal: Builds a `Z.KeyEvent` object from the given native key event.
  function keyEvent(native) {
    return Z.KeyEvent.create({
      kind        : native.type === 'keydown' ? Z.KeyDown : Z.KeyUp,
      isAlt       : native.altKey,
      isCtrl      : native.ctrlKey,
      isMeta      : native.metaKey,
      isShift     : native.shiftKey,
      timestamp   : new Date(),
      nativeEvent : native,
      key         : native.which
    });
  }

  // Internal: Builds a `Z.KeyEvent` object from the given native mouse event.
  function mouseEvent(native) {
    var type = native.type,
        node = native.target,
        view = Z.View.forNode(node),
        kind, button;

    if (type === 'mousemove') {
      kind = this.isMouseDown ? Z.MouseDrag : Z.MouseMove;
    }
    else {
      button = {0: 'left', 2: 'right'}[native.button] || 'other';
      kind   = {
        mousedown: {left: Z.LeftMouseDown, right: Z.RightMouseDown, other: Z.OtherMouseDown},
        mouseup:   {left: Z.LeftMouseUp,   right: Z.RightMouseUp,   other: Z.OtherMouseUp}
      }[type][button];

      if (kind === Z.LeftMouseDown) { this.isMouseDown = true; }
      else if (kind === Z.LeftMouseUp) { this.isMouseDown = false; }
    }

    return Z.MouseEvent.create({
      kind        : kind,
      isAlt       : native.altKey,
      isCtrl      : native.ctrlKey,
      isMeta      : native.metaKey,
      isShift     : native.shiftKey,
      timestamp   : new Date(),
      nativeEvent : native,
      window      : view && view.window(),
      view        : view,
      node        : node,
      location    : [native.clientX, native.clientY]
    });
  }

  // Internal: The key event listener - each native key event is converted to a
  // `Z.Event` object and dispatched to the run loop's app.
  function processKeyEvent(e) {
    if (this.app.dispatchEvent(keyEvent.call(this, e))) { this.run(); }
  }

  // Internal: The mouse event listener - each native mouse event is converted to
  // a `Z.Event` object and dispatched to the run loop's app.
  function processMouseEvent(e) {
    if (this.app.dispatchEvent(mouseEvent.call(this, e))) { this.run(); }
  }

  // Internal: Registers key listeners on the `document` node.
  function addKeyListeners() {
    var i, len;

    this.keyHandler = Z.bind(processKeyEvent, this);

    for (i = 0, len = keyEvents.length; i < len; i++) {
      document.addEventListener(keyEvents[i], this.keyHandler, false);
    }
  }

  // Internal: Deregisters key listeners on the `document` node.
  function removeKeyListeners() {
    var i, len;

    for (i = 0, len = keyEvents.length; i < len; i++) {
      document.removeEventListener(keyEvents[i], this.keyHandler, false);
    }

    this.keyHandler = null;
  }

  // Internal: Registers mouse listeners on the app's `container` node.
  function addMouseListeners(app) {
    var node = this.app.container(), i, len;

    this.mouseHandler = Z.bind(processMouseEvent, this);

    for (i = 0, len = mouseEvents.length; i < len; i++) {
      node.addEventListener(mouseEvents[i], this.mouseHandler, false);
    }
  }

  // Internal: Deregisters mouse listeners on the app's `container` node.
  function removeMouseListeners(app) {
    var node = this.app.container(), i, len;

    for (i = 0, len = mouseEvents.length; i < len; i++) {
      node.removeEventListener(mouseEvents[i], this.mouseHandler, false);
    }

    this.mouseHandler = null;
  }

  // Internal: The `Z.App` object the run loop belongs to.
  this.app = null;

  // Internal: A hash of function objects queued up with the `once` method.
  this.queue = null;

  // Public: The `Z.RunLoop` constructor - sets up event listeners.
  //
  // app - A `Z.App` object.
  this.def('initialize', function(app) {
    this.app   = app;
    this.queue = Z.Hash.create(function(h, k) { return h.at(k, Z.H()); });
    this.isMouseDown = false;

    addKeyListeners.call(this);
    addMouseListeners.call(this);
  });

  // Public: The `Z.RunLoop` destructor - tears down event listeners.
  this.def('destroy', function() {
    removeKeyListeners.call(this);
    removeMouseListeners.call(this);
  });

  // Public: Performs a single run of the run loop. This includes invoking the
  // app's `displayWindows` method as well as executing functions queued up with
  // the `once` method.
  this.def('run', function() {
    this.app.displayWindows();

    this.queue.each(function(tuple) {
      var o = tuple[0], methods = tuple[1];
      methods.keys().each(function(method) { o[method](); });
    });

    this.queue.clear();
  });

  // Public: Queues up a method to invoke on the given object at the end of the
  // next run loop.
  //
  // `o` - A `Z.Object` instance.
  // `m` - A string representing the method to invoke on `o`.
  //
  // Returns `o`.
  this.def('once', function(o, m) { this.queue.at(o).at(m, true); return o; });
});

