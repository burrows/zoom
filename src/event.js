(function() {

var slice = Array.prototype.slice;

// Public: Event type constants.
Z.KeyDown        = 'KeyDown';
Z.KeyUp          = 'KeyUp';
Z.LeftMouseDown  = 'LeftMouseDown';
Z.LeftMouseUp    = 'LeftMouseUp';
Z.RightMouseDown = 'RightMouseDown';
Z.RightMouseUp   = 'RightMouseUp';
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
    return this.supr().replace(/^leftM/, 'm');
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

// Public: The `Z.EventListener` type provides an object for listening for
// native mouse events on a given container node and key events on the document.
// Objects interested in being notified of events can observe the event
// listener's `event` property. It is updated every time a new event occurs.
//
// Examples
//
//   var listener = Z.EventListener.create(document.querySelector('#my-app'));
//
//   listener.observe('event', null, function(n) {
//     console.log(n.current); // #<Z.MouseEvent:156>
//   }, {current: true});
Z.EventListener = Z.Object.extend(function() {
  var viewClassRe, keyEvents, mouseEvents;

  // Internal: A regular expression for matching against a DOM element's
  // `className` property to determine if the element is a view's node.
  viewClassRe = /\bz-view\b/;

  // Internal: List of native key events to listen for.
  keyEvents = ['keydown', 'keyup'];

  // Internal: List of native mouse events to listen for.
  mouseEvents = ['mousemove', 'mousedown', 'mouseup', 'mouseover', 'mouseout'];

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

  // Internal: The key event listener - each native key event is converted to a
  // `Z.Event` object and set to the `event` property.
  function processKeyEvent(e) { this.callback(keyEvent.call(this, e)); }

  // Internal: The mouse event listener - each native mouse event is converted to
  // a `Z.Event` object and set to the `event` property.
  function processMouseEvent(e) {
    var target = e.target, related = e.relatedTarget;

    // ignore mouseover and mouseout events where the target node is not a
    // `Z.View` node and those where the mouseout is triggered upon entering a
    // child node from a parent node or a mouseover is triggered upon entering a
    // parent node from a child node
    if ((e.type === 'mouseover' || e.type === 'mouseout') &&
        ((!viewClassRe.test(target.className) ||
        (related && target.contains(related))))) {
      return;
    }

    this.callback(mouseEvent.call(this, e));
  }

  // Internal: Registers key listeners on the `document` node.
  function addKeyListeners() {
    var i, len;

    this.keyHandler = Z.bind(processKeyEvent, this);

    for (i = 0, len = keyEvents.length; i < len; i++) {
      document.addEventListener(keyEvents[i], this.keyHandler, false);
    }
  }

  // Internal: Deregisters key listeners from the `document` node.
  function removeKeyListeners() {
    var i, len;

    for (i = 0, len = keyEvents.length; i < len; i++) {
      document.removeEventListener(keyEvents[i], this.keyHandler, false);
    }

    this.keyHandler = null;
  }

  // Internal: Registers mouse listeners on the `container` node.
  function addMouseListeners(app) {
    var node = this.container, i, len;

    this.mouseHandler = Z.bind(processMouseEvent, this);

    for (i = 0, len = mouseEvents.length; i < len; i++) {
      node.addEventListener(mouseEvents[i], this.mouseHandler, false);
    }
  }

  // Internal: Deregisters mouse listeners from the `container` node.
  function removeMouseListeners(app) {
    var node = this.container, i, len;

    for (i = 0, len = mouseEvents.length; i < len; i++) {
      node.removeEventListener(mouseEvents[i], this.mouseHandler, false);
    }

    this.mouseHandler = null;
  }

  // Public: The `Z.EventListener` constructor. This sets up event listeners.
  //
  // container - A DOM node object to observe mouse events on.
  this.def('init', function(container, callback) {
    this.container = container;
    this.callback  = callback;
    addKeyListeners.call(this);
    addMouseListeners.call(this);
  });

  // Public: The `Z.EventListener` destructor. This removes all event listeners
  // setup by the `init` method.
  //
  // Returns nothing.
  this.def('destroy', function() {
    removeKeyListeners.call(this);
    removeMouseListeners.call(this);
  });
});

}());

