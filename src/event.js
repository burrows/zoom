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
Z.MouseDrag      = 'MouseDrag';

// Public: Provides a `Z.Object` wrapper type for native browser event objects.
Z.Event = Z.Object.extend(function() {
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

