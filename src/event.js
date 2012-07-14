Z.KeyDown        = 'KeyDown';
Z.KeyUp          = 'KeyUp';
Z.LeftMouseDown  = 'LeftMouseDown';
Z.LeftMouseUp    = 'LeftMouseUp';
Z.RightMouseDown = 'RightMouseDown';
Z.RightMouseUp   = 'RightMouseUp';
Z.OtherMouseDown = 'OtherMouseDown';
Z.OtherMouseUp   = 'OtherMouseUp';
Z.MouseMove      = 'MouseMove';

Z.Event = Z.Object.extend(function() {
  this.keyEvents   = Z.A('keydown', 'keyup');
  this.mouseEvents = Z.A('mousemove', 'mousedown', 'mouseup');

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
      x           : native.clientX,
      y           : native.clientY
    });
  }

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

  this.def('fromNative', function(native) {
    var type = native.type;
    if (this.keyEvents.contains(type)) { return keyEvent(native); }
    else if (this.mouseEvents.contains(type)) { return mouseEvent(native); }
    else {
      throw new Error('Z.Event.fromNative: unknown native event type: ' + type);
    }
  });

  this.prop('kind');
  this.prop('isAlt');
  this.prop('isCtrl');
  this.prop('isMeta');
  this.prop('isShift');
  this.prop('timestamp');
  this.prop('nativeEvent');

  // Internal: Specifies the properties for the `toString` method to display.
  this.def('toStringProperties', function() {
    return this.supr().concat('kind', 'isAlt', 'isCtrl', 'isMeta', 'isShift',
                              'timestamp');
  });

  this.def('handler', function() {
    var kind = this.kind();
    return kind[0].toLowerCase() + kind.slice(1);
  });
});

Z.MouseEvent = Z.Event.extend(function() {
  this.prop('window');
  this.prop('view');
  this.prop('node');
  this.prop('x');
  this.prop('y');

  this.def('handler', function() {
    return this.supr().replace(/^leftM/, 'm');
  });
});

Z.KeyEvent = Z.Event.extend(function() {
  this.prop('key');
});

