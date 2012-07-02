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
  // display and attempts to set the key view. The view to select as the key
  // view is determined as follows:
  //
  // 1. the current value of `keyView` if it currently accepts key view status
  // 2. the value of `initialKeyView` if it currently accepts key view status
  // 3. otherwise `keyView` is set to `null`
  //
  // Returns nothing.
  this.def('becomeKeyWindow', function() {
    var keyView = this.keyView(), initialKeyView = this.initialKeyView();

    if (keyView && keyView.acceptsKeyView()) {
      keyView.becomeKeyView();
    }
    else if (initialKeyView && initialKeyView.acceptsKeyView()) {
      this.keyView(initialKeyView);
      initialKeyView.becomeKeyView();
    }
    else { this.keyView(null); }

    this.isKey(true);
    this.needsDisplay(true);
  });

  // Public: Called by the window's `app` when it determines that it should no
  // longer be the key window. This method marks the receiver as not being key
  // and needing display. It also calls `resignKeyView` on the current `keyView`
  // if it is set.
  this.def('resignKeyWindow', function() {
    var keyView = this.keyView();

    if (keyView) { keyView.resignKeyView(); }
    this.isKey(false);
    this.needsDisplay(true);
  });

  // FIXME: Searches for the next valid key view and makes it the key view if
  // found.
  //
  // Search order:
  //   - current key view's nextValidKeyView
  //   - window's initialKeyView if it accepts key view
  //   - initialKeyView's nextValidKeyVIew
  this.def('selectNextKeyView', function() {
  });

  // FIXME: Searches for the previous valid key view and makes it the key view if
  // found.
  //
  // Search order:
  //   - current key view's previousValidKeyView
  //   - window's initialKeyView if it accepts key view
  //   - initialKeyView's previousValidKeyVIew
  this.def('selectPreviousKeyView', function() {
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

