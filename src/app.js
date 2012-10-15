// The `Z.App` type is the glue that brings most of the other components of Zoom
// together. `Z.App` instances do the following:
//
// * provide a root to the window/view hierarchy
// * setup and perform initial rendering of all windows and views
// * creates a `Z.EventListener` object to listen for native events
// * creates a statechart for modeling your app's state
// * dispatches events to the appropriate window
// * triggers run loops when events occur
//
// In order to create a concrete instance of `Z.App` a `Z.View` sub-type to use
// as the applications main view must be provided. When the app is started via
// the `start` method, a container node can optionally be specified to use for
// rendering the application (by default `document.body` is used).
//
// `Z.App` instances also provide something called a run loop. A run loop is
// simply something that waits for events to occur and dispatches them for
// handling to the program. In addition to doing this, the `Z.App` run loop also
// triggers view updates after it has dispatched an event. The reason it does
// this is because the Zoom view system is designed to buffer all DOM
// modifications - manipulating a view's `subviews` array for instance does not
// actually make any immediate changes to the DOM structure the view is
// managing. The DOM is not actually updated until the `Z.View.display` method
// is later invoked. But when does the `display` method get invoked? Every time
// our run loop observes an event. The reason for this indirection is that
// manipulating the DOM is expensive and we want to avoid doing it as much as
// possible. We minimize interaction with the DOM by allowing changes to "batch
// up" and then update the DOM all in one go after an event (which triggered the
// view changes in the first place) has been fully processed.
//
// For the most part, run loops are transparent to the developer and just happen
// automatically when an event occurs. But there may be times where you want to
// trigger a view update manually (e.g. after an ajax request completes and your
// models have been updated). In these situations you can simply invoke the
// app's `run` method to trigger a run of the run loop.
Z.App = Z.Object.extend(function() {
  // Private: Handles events observed by the event listener by dispatching them
  // to the appropriate window and triggering a run loop if they are handled.
  //
  // e - A `Z.Event` object..
  //
  // Returns nothing.
  function processEvent(e) { if (this.dispatchEvent(e)) { this.run(); } }

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

  // Public: The application's statechart.
  this.prop('statechart');

  // Public: The current states of the application's statechart.
  this.prop('current', {
    readonly: true,
    dependsOn: ['statechart.current'],
    get: function() { return this.get('statechart.current'); }
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
    this.statechart(Z.State.define());
  });

  // Public: Starts running the app by creating an event listener, rendering all
  // windows, intializing the statechart, and performing a run loop.
  //
  // container - A DOM node to contain the app (default: `document.body`).
  // states    - An array of state paths to initialize the statechart with
  //             (default: `[]`).
  //
  // Returns the receiver.
  this.def('start', function(container, states) {
    var self = this;

    this.container = container || document.body;
    this.listener  = Z.EventListener.create(this.container,
                                            Z.bind(processEvent, this));

    if (!this.keyWindow()) {
      this.keyWindow(this.mainWindow());
      this.mainWindow().becomeKeyWindow();
    }

    this.statechart().goto(states || []);
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

  // Public: Perform a run of the run loop. This involes updating any views that
  // need updating and executing any methods queued up by the `once` method.
  this.def('run', function() {
    this.displayWindows();

    this.queue.each(function(tuple) {
      var o = tuple[0], methods = tuple[1];
      methods.keys().each(function(method) { o[method](); });
    });

    this.queue.clear();
    return this;
  });

  // Public: Delegates to the `statechart`'s `send` method. Use this method to
  // send actions to the app's statechart.
  this.def('send', function() {
    var sc = this.statechart();
    return sc.send.apply(sc, arguments);
  });

  // Public: Queues up a method to invoke on the given object at the end of the
  // next run of the run loop.
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
  // This method is invoked by the `run` method.
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
  // This method is called when the app is notified of an event by the event
  // listener and returns a boolean indicating whether it handled the event. The
  // app will only trigger a run of the run loop if this method returns `true`.
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

