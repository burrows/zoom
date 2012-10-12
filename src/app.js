// The `Z.App` type is the root of the Zoom window/view hierarchy. Instances
// are responsible for setting up and initially rendering all of an
// application's windows and views. In order to create a concrete instance of
// `Z.App`, a view type to use as the applications main view must be provided.
// Additionally, a container node can be optionally specified to use for
// rendering the application (by default `document.body` is used).
Z.App = Z.Object.extend(function() {
  function processEvent(n) { if (this.dispatchEvent(n.current)) { this.run();} }

  // Public: A regular property that holds the container DOM node. All DOM
  // modifications and mouse events observed happen within this container.
  this.container = null;

  // Internal: A hash of function objects queued up with the `once` method.
  this.queue = null;

  // Public: An array containing all of the application's `Z.Window` objects.
  // Every application has at least one window, the main window, which is always
  // at index `0`.
  this.prop('windows', {
    readonly: true,
    get: function() { return this.__windows__ = this.__windows__ || Z.A(); }
  });

  // Public: The application's main window. Every application has one and only
  // one main window.
  this.prop('mainWindow', {
    readonly: true,
    get: function() { return this.get('windows.first'); }
  });

  // Public: The window that currently has keyboard focus. All keyboard events
  // observed by the application will be sent to the window pointed to by this
  // property.
  this.prop('keyWindow');

  // Public: The `Z.App` constructor.
  //
  // mainView  - A sub-type of `Z.App` to use as the root view of the
  //             application's main window.
  this.def('init', function(mainView) {
    if (!(Z.isA(mainView, Z.View) && mainView.isType)) {
      throw new Error(Z.fmt("%@.init: must provide a sub-type of `Z.View` as the main view type",
                            this.typeName()));
    }

    // create the application's main window
    this.windows().push(Z.Window.create(mainView, {
      app: this, isMain: true, isKey: true
    }));

    this.queue = Z.Hash.create(function(h, k) { return h.at(k, Z.H()); });
  });

  // Public: Starts running the app by creating a run loop and rendering all
  // windows.
  //
  // container - A DOM node to contain the app (default: `document.body`).
  //
  // Returns the receiver.
  this.def('start', function(container) {
    this.container = container || document.body;
    this.listener = Z.EventListener.create(this.container);
    this.listener.observe('event', this, processEvent, {current: true});

    if (!this.keyWindow()) {
      this.keyWindow(this.mainWindow());
      this.mainWindow().becomeKeyWindow();
    }

    this.run();
    this.__started__ = true;

    return this;
  });

  // Public: Destroys the app by removing all windows from the DOM and
  // destroying the app's event listener.
  //
  // Returns the receiver.
  this.def('destroy', function() {
    if (this.__started__) {
      this.set('keyWindow', null);
      this.removeWindows().displayWindows();
      this.listener.destroy();
    }

    return this;
  });

  // Public: Execute a run loop.
  this.def('run', function() {
    this.displayWindows();

    this.queue.each(function(tuple) {
      var o = tuple[0], methods = tuple[1];
      methods.keys().each(function(method) { o[method](); });
    });

    this.queue.clear();
    return this;
  });

  // Public: Queues up a method to invoke on the given object at the end of the
  // next run loop.
  //
  // `o` - A `Z.Object` instance.
  // `m` - A string representing the method to invoke on `o`.
  //
  // Returns `o`.
  this.def('once', function(o, m) { this.queue.at(o).at(m, true); return o; });

  // Public: Display's the app's windows by invoking each window's
  // `displayIfNeeded` method and attaching their nodes to the `container` node
  // if necessary.
  //
  // This method is invoked by `Z.RunLoop` during each run after all bindings
  // have been flushed..
  //
  // Returns the receiver.
  this.def('displayWindows', function() {
    var container = this.container, windows = this.windows(),
        removed, window, i, size, node;

    // ensure that all removed windows have had their nodes detached
    if (removed = this.__removedWindows__) {
      for (i = 0, size = removed.length; i < size; i++) {
        node = removed[i].node;
        if (node.parentNode === container) {
          container.removeChild(node);
          removed[i].notifyDidDetachNode();
        }
      }
      delete this.__removedWindows__;
    }

    for (i = 0, size = windows.size(); i < size; i++) {
      window = windows.at(i);
      window.displayIfNeeded();
      if (window.node.parentNode !== container) {
        container.appendChild(window.node);
        window.notifyDidAttachNode();
      }
    }

    return this;
  });

  // Public: Adds a new window to this app's `windows` array. The window will be
  // displayed during the next running of the run loop.
  //
  // window - A concrete `Z.Window` or sub-type instance.
  //
  // Returns the window concrete instance added.
  // Throws `Error` if the given object is not a `Z.Window` object.
  this.def('addWindow', function(window) {
    if (!Z.isA(window, Z.Window) || window.isType) {
      throw new Error(Z.fmt("Z.App.addWindow: expected a `Z.Window` concrete instance, but received `%@` instead.", window));
    }

    window.set({app: this, isMain: false});
    this.windows().push(window);
    return window;
  });

  // Public: Removes the given window from this app's `windows` array. The window
  // will be removed from the DOM during the next running of the run loop.
  //
  // window - A `Z.Window` that currently exists in the `windows` array.
  //
  // Returns the given window.
  // Throws `Error` if the given object is not in the `windows` array.
  this.def('removeWindow', function(window) {
    var windows = this.windows(), i = windows.index(window);

    if (i === null) {
      throw new Error(Z.fmt("Z.App.removeWindow: given object does not exist in the app's `windows` array: %@", window));
    }

    windows.splice(i, 1);

    (this.__removedWindows__ = this.__removedWindows__ || []).push(window);
    return window;
  });

  // Public: Removes all window's belonging to the app by passing each to
  // `removeWindow`.
  //
  // Returns the receiver.
  this.def('removeWindows', function() {
    var self = this, windows = this.windows().slice();
    windows.each(function(window) { self.removeWindow(window); });
    return this;
  });

  // Public: Makes the given window the key window. This method will invoke the
  // `resignKeyWindow` method on the current key window and `becomeKeyWindow` on
  // the new key window.
  //
  // window - A `Z.Window` instance to make the new key window.
  //
  // Returns `window`.
  this.def('makeKeyWindow', function(window) {
    var keyWindow = this.keyWindow(), windows = this.windows();

    if (!windows.contains(window)) {
      throw new Error(Z.fmt("%@.makeKeyWindow: attempted to make a window that doesn't belong to the application the key window",
                            this.typeName()));
    }

    if (keyWindow !== window) {
      keyWindow.resignKeyWindow();
      this.keyWindow(window);
      window.becomeKeyWindow();
    }

    return window;
  });

  // Internal: Dispatches the given `Z.Event` object to the appropriate window.
  // For keyboard events, the event is sent to the key window. For mouse events,
  // the event is sent to the window over which the event occurred. If a mouse
  // down event occurs over a window that is not the key window, it is first
  // made the key window before the event is dispatched to it.
  //
  // This method is called by the app's `runLoop` object and returns a boolean
  // indicated whether it handled the event. The run loop object only triggers
  // a run of the run loop if this method returns `true`.
  //
  // e - A `Z.Event` object.
  //
  // Returns `true` if the app processes the event and `false` if it does not.
  this.def('dispatchEvent', function(e) {
    var keyWin = this.keyWindow(), view, window;

    if (e.isA(Z.MouseEvent)) {
      view   = e.view;
      window = view && view.window();

      if (!view || !window) { return false; }

      if (e.kind === Z.MouseMove && !window.acceptsMouseMoveEvents()) {
        return false;
      }

      if (e.kind === Z.LeftMouseDown) {
        keyWin = this.makeKeyWindow(e.window);
      }
    }

    keyWin.dispatchEvent(e);

    return true;
  });
});

