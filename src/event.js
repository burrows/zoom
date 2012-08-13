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
});

// Public: A `Z.Event` wrapper for browser native key events.
Z.KeyEvent = Z.Event.extend(function() {
  // Public: A regular property containing they character code of the key event.
  this.key = null;
});

