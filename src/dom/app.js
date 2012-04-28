
// The `Z.DOMApp` type is the root of the Zoom window/view hierarchy. Instances
// are responsible for setting up and initially drawing all of an application's
// windows and view. In order to create an instance of `Z.DOMApp` it must be
// provided a view type to use as the applications main view and optionally a
// container node to use for drawing the views (by default `document.body` is
// used). Additionaly, a `Z.DOMApp` instance observes keyboard and mouse events
// and dispatches them to the appropriate view. Only mouse events that occur
// withing the container are processed.
Z.DOMApp = Z.Object.extend(function() {
  // Internal: Attaches the given window's node to the application's container
  // node, thereby making it visible on screen. The window's `draw` method is
  // invoked first.
  //
  // window - The window t
  function attachWindow(window) {
    var container = this.container(), node = window.node();
    window.draw();
    container.appendChild(node);
  }

  // Internal: Detaches the given window's node from the application's container
  // node, thereby removing it from the screen.
  function detachWindow(window) {
    this.container().removeChild(window.node());
  }

  // Public: A property that returns the container DOM node that the application
  // was initialized with. If a container was not specified by the constructor,
  // then `document.body` is returned. All DOM modifications and events observed
  // happen within this container.
  this.prop('container', {
    get: function() {
      return this.__container__ = this.__container__ || document.body;
    }
  });

  // Public: An array containing all of the application's `Z.DOMWindow` objects.
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

  // Public: A boolean indicating whether the application has been started yet.
  // No windows are drawn on the screen until the application is started.
  this.prop('isStarted', { def: false });

  // Public: The window that currently has keyboard focus. All keyboard events
  // observed by the application will be sent to the window pointed to by this
  // property.
  this.prop('keyWindow');

  // Public: The `Z.DOMApp` constructor.
  //
  // mainView  - A sub-type of `Z.DOMApp` to use as the root view of the
  //             application's main window.
  // container - A DOM node to contain the app (default: `document.body`).
  this.def('initialize', function(mainView, container) {
    if (!(Z.isA(mainView, Z.DOMView) && mainView.isType)) {
      throw new Error(Z.fmt("%@.initialize: must provide a sub-type of `Z.DOMView` as the main view type",
                            this.typeName()));
    }

    // create the application's main window
    this.windows().push(Z.DOMWindow.create({
      app: this,
      contentView: mainView.create(),
      isMain: true,
      isKey: true
    }));

    if (container) { this.set('container', container); }
  });

  // Public: Starts the application by drawing and attaching all windows and
  // setting up event listeners.
  //
  // Returns the receiver.
  this.def('start', function() {
    var self = this;

    if (this.isStarted()) { return this; }

    this.keyWindow(this.mainWindow());
    this.listen();
    this.windows().each(function(window) { attachWindow.call(self, window); });
    this.isStarted(true);

    return this;
  });

  // Public: Stops the app by removing all windows and event listeners from the
  // container. A stopped app may be restarted again by invoking the `start`
  // method.
  //
  // Returns the receiver.
  this.def('stop', function() {
    var self = this;

    if (!this.isStarted()) { return this; }

    this.set('keyWindow', null);
    this.windows().each(function(window) { detachWindow.call(self, window); });
    this.stopListening();
    this.isStarted(false);
    return this;
  });

  // Public: Completely cleans up the application by destroying all windows and
  // views. Once destroyed, there will be no trace left of the application in
  // the page.
  //
  // Returns the receiver.
  this.def('destroy', function() {
    var self = this, windows = this.windows(), mainWindow = windows.shift();
    this.stop();
    windows.invoke('destroy');
    mainWindow.destroy();
    return this;
  });

  this.def('listen', function() {
  });

  this.def('stopListening', function() {
  });

  // Public: Creates a new `Z.DOMWindow` object with the given view set to its
  // `contentView` property and adds it to the application's `windows` array. If
  // the application has already been started then the window is drawn and its
  // node is attached to the page.
  //
  // viewType - A `Z.DOMView` sub-type to use as the window's `contentView`.
  // opts     - A native object containing options to pass to the `Z.DOMWIndow`
  //            constructor (default: `{}`).
  //
  // Returns the new `Z.DOMWindow` concrete instance.
  this.def('createWindow', function(viewType, opts) {
    var window = Z.DOMWindow.create(Z.merge(opts || {}, {
      app: this, isMain: false, contentView: viewType.create()
    }));

    this.windows().push(window);

    if (this.isStarted()) { attachWindow.call(this, window) }

    return window;
  });

  // Public: Destroys the given window and removes it from the `windows` array.
  //
  // window - The `Z.DOMWindow` object to destroy.
  //
  // Returns the given window.
  // Throws `Error` if passed a window that does not belong to the application.
  // Throws `Error` if passed the main window.
  this.def('destroyWindow', function(window) {
    var windows = this.windows(), idx = windows.index(window);

    if (idx === null) {
      throw new Error(Z.fmt("%@.destroyWindow: attempted to destroy a window that doesn't belong to the application",
                            this.typeName()));
    }

    if (window === this.mainWindow()) {
      throw new Error(Z.fmt("%@.destroyWindow: can't destroy the main window",
                            this.typeName()));
    }

    window.destroy();
    windows.splice(idx, 1);

    return window;
  });

  this.def('dispatchMouseEvent', function(event) {
  });

  this.def('dispatchKeyEvent', function(event) {
  });
});

