// Public: Event type constants.
Z.KeyDown        = 'KeyDown';
Z.KeyUp          = 'KeyUp';
Z.LeftClick      = 'LeftClick';
Z.LeftMouseDown  = 'LeftMouseDown';
Z.LeftMouseUp    = 'LeftMouseUp';
Z.RightClick     = 'RightClick';
Z.RightMouseDown = 'RightMouseDown';
Z.RightMouseUp   = 'RightMouseUp';
Z.OtherClick     = 'OtherClick';
Z.OtherMouseDown = 'OtherMouseDown';
Z.OtherMouseUp   = 'OtherMouseUp';
Z.MouseMove      = 'MouseMove';
Z.MouseEnter     = 'MouseEnter';
Z.MouseExit      = 'MouseExit';

// Public: Provides a `Z.Object` wrapper type for native browser event objects.
Z.Event = Z.Object.extend(function() {
  // Public: A regular property indicating the kind of event this object
  // represents. The supported event kinds are listed at the top of this file.
  this.kind = null;

  // Public: A regular property indicating whether the Alt key was pressed when
  // the event was triggered.
  this.isAlt = null;

  // Public: A regular property indicating whether the Ctrl key was pressed when
  // the event was triggered.
  this.isCtrl = null;

  // Public: A regular property indicating whether the Meta key was pressed when
  // the event was triggered.
  this.isMeta = null;

  // Public: A regular property indicating whether the Shift key was pressed
  // when the event was triggered.
  this.isShift = null;

  // Public: A regular property containing a `Date` object representing the time
  // at which the event was observed.
  this.timestamp = null;

  // Public: A regular property containing the native event this object is
  // wrapping.
  this.nativeEvent = null;

  // Public: Overrides the default `init` method to allow for setting the event
  // object's regular properties using a native object.
  this.def('init', function(props) { return Z.merge(this, props || {}); });

  // Internal: Converts the event's `kind` to the name of a handler method name
  // that views can implement in order to be notified of the event.
  this.def('handler', function() {
    return this.kind[0].toLowerCase() + this.kind.slice(1);
  });
});

// Public: A `Z.Event` wrapper for browser native mouse events.
Z.MouseEvent = Z.Event.extend(function() {
  // Public: A regular property containing the `Z.Window` object over which the
  // event occurred.
  this.window = null;

  // Public: A regular property containing the `Z.View` object over which the
  // event occurred.
  this.view = null;

  // Public: A regular property containing the DOM node over which the event
  // occurred.
  this.node = null;

  // Public: A regular property containing the x and y coordinates of the mouse
  // event relative to the browser window.
  this.location = null;

  // Internal: Converts the event's `kind` to the name of a handler method name
  // that views can implement in order to be notified of the event.
  this.def('handler', function() {
    return this.supr().replace(/^leftM/, 'm').replace(/^leftC/, 'c');
  });

  // Internal: Specifies the properties for the `toString` method to display.
  this.def('toStringProperties', function() {
    return this.supr().concat('kind', 'view');
  });
});

// Public: A `Z.Event` wrapper for browser native key events.
Z.KeyEvent = Z.Event.extend(function() {
  // Public: A regular property containing they character code of the key event.
  this.key = null;
});

// Public: The `Z.KeyEventListener` type provides an object for listening for
// native key events on the document. It converts the native events to a
// `Z.KeyEvent` object and passes it to the given callback function.
Z.KeyEventListener = Z.Object.extend(function() {
  var events;

  // Internal: List of native key events to listen for.
  events = ['keydown', 'keyup'];

  // Internal: The key event listener - each native key event is converted to a
  // `Z.KeyEvent` object and passed to the registered `callback`.
  function process(e) {
    this.callback(Z.KeyEvent.create({
      kind        : e.type === 'keydown' ? Z.KeyDown : Z.KeyUp,
      isAlt       : e.altKey,
      isCtrl      : e.ctrlKey,
      isMeta      : e.metaKey,
      isShift     : e.shiftKey,
      timestamp   : new Date(),
      nativeEvent : e,
      key         : e.which
    }));
  }

  // Internal: Registers key listeners on the `document` node.
  function addListeners() {
    var i, len;

    this.handler = Z.bind(process, this);

    for (i = 0, len = events.length; i < len; i++) {
      document.addEventListener(events[i], this.handler, false);
    }
  }

  // Internal: Deregisters key listeners from the `document` node.
  function removeListeners() {
    var i, len;

    for (i = 0, len = events.length; i < len; i++) {
      document.removeEventListener(events[i], this.handler, false);
    }

    this.handler = null;
  }

  // Public: The `Z.KeyEventListener` constructor. This sets up event listeners.
  //
  // callback - A function to be invoked on each key event.
  this.def('init', function(callback) {
    this.callback = callback;
    addListeners.call(this);
  });

  // Public: The `Z.EventListener` destructor. This removes all event listeners
  // setup by the `init` method.
  //
  // Returns the receiver.
  this.def('destroy', function() {
    removeListeners.call(this);
    return this.supr();
  });
});

// Public: The `Z.MouseEventListener` type provides an object for listening for
// native mouse events on the given DOM node. It converts the native events to a
// `Z.MouseEvent` object and passes it to the given callback function.
Z.MouseEventListener = Z.Object.extend(function() {
  var events;

  // Internal: List of native mouse events to listen for.
  events = [
    'click', 'mousemove', 'mousedown', 'mouseup', 'mouseover', 'mouseout'
  ];

  // Internal: Builds a `Z.MouseEvent` object from the given native mouse event.
  function event(native) {
    var type = native.type,
        node = native.target,
        view = Z.View.forNode(node),
        kind, button;

    if (type === 'mousemove') {
      kind = Z.MouseMove;
    }
    else if (type === 'mouseover') {
      kind = Z.MouseEnter;
    }
    else if (type === 'mouseout') {
      kind = Z.MouseExit;
    }
    else {
      button = {0: 'left', 2: 'right'}[native.button] || 'other';
      kind   = {
        click:     {left: Z.LeftClick,     right: Z.RightClick,     other: Z.OtherClick},
        mousedown: {left: Z.LeftMouseDown, right: Z.RightMouseDown, other: Z.OtherMouseDown},
        mouseup:   {left: Z.LeftMouseUp,   right: Z.RightMouseUp,   other: Z.OtherMouseUp}
      }[type][button];
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

  // Internal: The event listener - each native mouse event is converted to a
  // `Z.MouseEvent` object and passed to the registered callback.
  function process(e) {
    var target, related, view;

    // ignore mouseover and mouseout events where the mouseout is triggered upon
    // entering a child node from a parent node or a mouseover is triggered upon
    // entering a parent node from a child node
    if (e.type === 'mouseover' || e.type === 'mouseout') {
      target  = e.target;
      related = e.relatedTarget;
      view    = Z.View.forNode(target);
      if (!view || (related && view.node.contains(related))) { return; }
    }

    this.callback(event.call(this, e));
  }

  // Internal: Registers mouse listeners on the `container` node.
  function addListeners() {
    var i, len;

    this.handler = Z.bind(process, this);

    for (i = 0, len = events.length; i < len; i++) {
      this.node.addEventListener(events[i], this.handler, false);
    }
  }

  // Internal: Deregisters mouse listeners from the `container` node.
  function removeListeners() {
    var i, len;

    for (i = 0, len = events.length; i < len; i++) {
      this.node.removeEventListener(events[i], this.handler, false);
    }

    this.handler = null;
  }

  // Public: The `Z.EventListener` constructor. This sets up event listeners.
  //
  // node     - A DOM node object to observe mouse events on.
  // callback - A function to be invoked on each mouse event.
  this.def('init', function(node, callback) {
    this.node     = node;
    this.callback = callback;
    addListeners.call(this);
  });

  // Public: The `Z.EventListener` destructor. This removes all event listeners
  // setup by the `init` method.
  //
  // Returns the receiver..
  this.def('destroy', function() {
    removeListeners.call(this);
    return this.supr();
  });
});

