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

// Public: Provides a `Z.Object` wrapper type for native browser event objects.
Z.Event = Z.Object.extend(function() {
  var keyEvents, mouseEvents;

  // Internal: List of native key events that the Zoom event system listens for.
  keyEvents = Z.A('keydown', 'keyup');

  // Internal: List of native mouse events that the Zoom event system listens
  // for.
  mouseEvents = Z.A('mousemove', 'mousedown', 'mouseup');

  // Internal: Builds a `Z.MouseEvent` from the given native event object.
  //
  // native - A native browser mouse event object.
  //
  // Returns a `Z.MouseEvent` object.
  function mouseEvent(native) {
    var type = native.type,
        node = native.target,
        view = Z.View.forNode(node),
        kind, button;

    if (type === 'mousemove') { kind = Z.MouseMove; }
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
      window      : view.window(),
      view        : view,
      node        : node,
      location    : [native.clientX, native.clientY]
    });
  }

  // Internal: Builds a `Z.KeyEvent` from the given native event object.
  //
  // native - A native browser key event object.
  //
  // Returns a `Z.KeyEvent` object.
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

  // Internal: Registers the given function as an event listener for all key
  // events.
  this.def('registerKeyListener', function(fn) {
    keyEvents.each(function(e) { document.addEventListener(e, fn, false); });
  });

  // Internal: Deregisters the given function as an event listener for all key
  // events.
  this.def('deregisterKeyListener', function(fn) {
    keyEvents.each(function(e) { document.removeEventListener(e, fn, false); });
  });

  // Internal: Registers the given function as an event listener for all mouse
  // events.
  this.def('registerMouseListener', function(node, fn) {
    mouseEvents.each(function(e) { node.addEventListener(e, fn, false); });
  });

  // Internal: Deregisters the given function as an event listener for all mouse
  // events.
  this.def('deregisterMouseListener', function(node, fn) {
    mouseEvents.each(function(e) { node.removeEventListener(e, fn, false); });
  });

  // Internal: Builds a `Z.Event` object from the given native event object.
  this.def('fromNative', function(native) {
    var type = native.type;
    if (keyEvents.contains(type)) { return keyEvent(native); }
    else if (mouseEvents.contains(type)) { return mouseEvent(native); }
    else {
      throw new Error('Z.Event.fromNative: unknown native event type: ' + type);
    }
  });

  // Public: A property indicating the kind of event this represents. The
  // supported event kinds are listed at the top of this file.
  this.prop('kind');

  // Public: A property indicating whether or the the Alt key was pressed when
  // the event was triggered.
  this.prop('isAlt');

  // Public: A property indicating whether or the the Ctrl key was pressed when
  // the event was triggered.
  this.prop('isCtrl');

  // Public: A property indicating whether or the the Meta key was pressed when
  // the event was triggered.
  this.prop('isMeta');

  // Public: A property indicating whether or the the Shift key was pressed when
  // the event was triggered.
  this.prop('isShift');

  // Public: A property containing a `Date` object representing the time at
  // which the event was observed.
  this.prop('timestamp');

  // Public: A property containing the native event this object is wrapping.
  this.prop('nativeEvent');

  // Internal: Specifies the properties for the `toString` method to display.
  //
  // native - A native browser mouse event object.
  //
  // Returns a `Z.Event` object.
  this.def('toStringProperties', function() {
    return this.supr().concat('kind', 'isAlt', 'isCtrl', 'isMeta', 'isShift',
                              'timestamp');
  });

  // Internal: Converts the event's `kind` to the name of a handler method name
  // that views can implement in order to be notified of the event.
  this.def('handler', function() {
    var kind = this.kind();
    return kind[0].toLowerCase() + kind.slice(1);
  });
});

// Public: A `Z.Event` wrapper for browser native mouse events.
Z.MouseEvent = Z.Event.extend(function() {
  // Public: A property containing the `Z.Window` object over which the event
  // occurred.
  this.prop('window');

  // Public: A property containing the `Z.View` object over which the event
  // occurred.
  this.prop('view');

  // Public: A property containing the DOM node over which the event occurred.
  this.prop('node');

  // Public: A property containing the x and y coordinates of the mouse event
  // relative to the browser window.
  this.prop('location');

  // Internal: Converts the event's `kind` to the name of a handler method name
  // that views can implement in order to be notified of the event.
  this.def('handler', function() {
    return this.supr().replace(/^leftM/, 'm');
  });
});

// Public: A `Z.Event` wrapper for browser native key events.
Z.KeyEvent = Z.Event.extend(function() {
  // Public: A property containing they character code of the key event.
  this.prop('key');
});

