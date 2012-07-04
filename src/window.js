// `Z.Window` objects provide a root for `Z.View` hierarchies and accept and
// distribute events from the app that manages them.
Z.Window = Z.View.extend(function() {
  // Public: A property that returns the `Z.App` object that owns the window.
  this.prop('app');

  // Public: Indicates whether the window is the main window.
  this.prop('isMain', { def: false });

  // Public: A property that returns the window's content view.
  this.prop('contentView');

  // Public: The window's current key view. Keyboard events sent to this window
  // will be first sent to the value of this property.
  this.prop('keyView');

  // Public: A property that returns the view that should be made the key view
  // when the window becomes the key window.
  this.prop('initialKeyView');

  // Internal: Specifies the properties for the `toString` method to display.
  this.def('toStringProperties', function() {
    return this.supr().concat('isMain');
  });

  // Public: Overrides `Z.View.classes` to append window specific class names to
  // the window's node.
  this.def('classes', function() {
    var classes = this.supr().concat('z-window');
    if (this.isMain()) { classes.push('z-main-window'); }
    return classes;
  });

  // Public: The `Z.Window` constructor. Creates the window's content view.
  //
  // view - A `Z.View` sub-type or instance.
  // opts - An optional native object of properties to set (default: `{}`).
  this.def('initialize', function(view, opts) {
    var self = this;
    this.supr(opts);
    this.contentView(this.addSubview(view.isType ? view.create() : view));
    this.contentView().each(function(v) { v.window(self); });
  });

  // Public: Called by the window's `app` when it determines that it should
  // be the key window. This method marks the receiver as being key and needing
  // display and attempts to set the key view to `initialKeyView` if its not
  // already set.
  //
  // Returns nothing.
  this.def('becomeKeyWindow', function() {
    var initialKeyView = this.initialKeyView();

    if (!this.keyView() && initialKeyView && initialKeyView.acceptsKeyView()) {
      this.makeKeyView(initialKeyView);
    }

    this.isKey(true);
    this.needsDisplay(true);
  });

  // Public: Called by the window's `app` when it determines that it should no
  // longer be the key window. This method marks the receiver as not being key
  // and needing display.
  this.def('resignKeyWindow', function() {
    this.isKey(false);
    this.needsDisplay(true);
  });

  // Public: Searches for the next valid key view and attempts to make it the
  // key view if found. The search order is as follows:
  //
  // * current `keyView`'s `nextValidKeyView`
  // * `initialKeyView` if it currently accepts key view
  // * `initialKeyView`'s `nextValidKeyView`
  //
  // Returns nothing.
  this.def('selectNextKeyView', function() {
    var current = this.keyView(), initial = this.initialKeyView(), next;

    if (current && (next = current.nextValidKeyView()) && next.acceptsKeyView()) {
      this.makeKeyView(next);
    }
    else if (initial) {
      if (initial.acceptsKeyView()) {
        this.makeKeyView(initial);
      }
      else if ((next = initial.nextKeyView()) && next.acceptsKeyView()) {
        this.makeKeyView(next);
      }
      else {
        this.makeKeyView(null);
      }
    }
    else {
      this.makeKeyView(null);
    }
  });

  // Public: Searches for the previous valid key view and attempts to make it
  // the key view if found. The search order is as follows:
  //
  // * current `keyView`'s `previousValidKeyView`
  // * `initialKeyView` if it currently accepts key view
  // * `initialKeyView`'s `previousValidKeyView`
  //
  // Returns nothing.
  this.def('selectPreviousKeyView', function() {
    var current = this.keyView(), initial = this.initialKeyView(), prev;

    if (current && (prev = current.previousValidKeyView()) && prev.acceptsKeyView()) {
      this.makeKeyView(prev);
    }
    else if (initial) {
      if (initial.acceptsKeyView()) {
        this.makeKeyView(initial);
      }
      else if ((prev = initial.previousKeyView()) && prev.acceptsKeyView()) {
        this.makeKeyView(prev);
      }
      else {
        this.makeKeyView(null);
      }
    }
    else {
      this.makeKeyView(null);
    }
  });

  // Public: Attempts to make the given view the key view for the window.
  //
  // If `view` isn't already the key view, `resignKeyView` is called on the
  // current `keyView`. If that view refuses to resign, it remains the key view
  // and `false` is returned. If the current key view resigns, `becomeKeyView`
  // is called on `view`. If `view` refuses key view status then `keyView` is
  // set to `null`. Either way, this method would then return `true`.
  //
  // view - A `Z.View` instance owned by the window.
  //
  // Returns `true` if successful and `false` otherwise.
  this.def('makeKeyView', function(view) {
    var current = this.keyView();

    if (current === view) { return true; }
    if (current && !current.resignKeyView()) { return false; }
    this.keyView(view && view.becomeKeyView() ? view : null);

    return true;
  });

  this.def('dispatchEvent', function(e) {
  });
});

