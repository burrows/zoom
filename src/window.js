Z.Window = Z.View.extend(function() {
  this.prop('app');
  this.prop('isMain', { def: false });
  this.prop('contentView');
  this.prop('keyView');

  // Public: A Property that returns the view that should be made the key view
  // when the window becomes the key window.
  this.prop('initialKeyView');

  this.def('classes', function() {
    var classes = this.supr().concat('z-window');
    if (this.isMain()) { classes.push('z-main-window'); }
    return classes;
  });

  this.def('initialize', function(view, opts) {
    this.supr(opts);
    this.contentView(this.addSubview(view.isType ? view.create() : view));
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
});

