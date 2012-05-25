// The `Z.App` type is the root of the Zoom window/view hierarchy. Instances
// are responsible for setting up and initially drawing all of an application's
// windows and view. In order to create an instance of `Z.App` it must be
// provided a view type to use as the applications main view and optionally a
// container node to use for drawing the views (by default `document.body` is
// used). Additionaly, a `Z.App` instance observes keyboard and mouse events
// and dispatches them to the appropriate view. Only mouse events that occur
// withing the container are processed.
Z.App = Z.Object.extend(function() {
  var appEvents, bodyEvents;

  // Internal: This list of events to observe on the application's `container`
  // node.
  appEvents = [
    'click',
    'dblclick',
    'mousedown',
    'mouseup',
    'mouseover',
    'mousemove',
    'mouseout',
    'keydown',
    'keypress',
    'keyup',
    'select',
    'change',
    'submit',
    'reset',
    'focus',
    'blur'
  ];

  // Internal: This list of events to observe on the documents's `body` node.
  // When there is more than one application on a page, these events will be
  // delivered to all of them.
  bodyEvents = ['keydown', 'keypress', 'keyup'];

  // Internal: Dispatches an event up the superivew chain starting from the
  // given view.
  //
  // TODO: send the event to the app's statechart if it bubbles all the way up
  //
  // event - A native DOM event.
  // view  - A `Z.View` object to begin sending the event to.
  //
  // Returns nothing.
  function dispatchEvent(event, view) {
    while (view && view.handleEvent(event) !== true) {
      view = view.superview();
    }
  }

  // Internal: An event listener callback for events observed somewhere inside
  // the application's `container`.
  function processAppEvent(event) {
    dispatchEvent(event, Z.View.viewForNode(event.target));
  }

  // Internal: An event listener callback for key events observed on the body.
  function processBodyEvent(event) {
    var keyView = this.get('keyWindow.keyView');
    if (event.target !== document.body || !keyView) { return; }
    dispatchEvent(event, keyView);
  }

  // Internal: Attaches the given window's node to the application's container
  // node, thereby making it visible on screen. The window's `draw` method is
  // invoked first.
  //
  // window - The window to attach.
  //
  // Returns nothing.
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

  // Public: A boolean indicating whether the application has been started yet.
  // No windows are drawn on the screen until the application is started.
  this.prop('isStarted', { def: false });

  // Public: The window that currently has keyboard focus. All keyboard events
  // observed by the application will be sent to the window pointed to by this
  // property.
  this.prop('keyWindow');

  // Public: The `Z.App` constructor.
  //
  // mainView  - A sub-type of `Z.App` to use as the root view of the
  //             application's main window.
  // container - A DOM node to contain the app (default: `document.body`).
  this.def('initialize', function(mainView, container) {
    if (!(Z.isA(mainView, Z.View) && mainView.isType)) {
      throw new Error(Z.fmt("%@.initialize: must provide a sub-type of `Z.View` as the main view type",
                            this.typeName()));
    }

    // create the application's main window
    this.windows().push(Z.Window.create(mainView, {
      app: this,
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
  // the container.
  //
  // Returns the receiver.
  this.def('destroy', function() {
    this.stop();
    this.windows().invoke('destroy');
    return this;
  });

  // Public: Begins listening for user events. Most events are observed on the
  // application's `container` node, but keyboard events are also observed on
  // the document's `body` node. This is necessary because keyboard events only
  // have a target when a particular node has focus, but we can't be sure that
  // some node under the application's control always has focus, so each
  // application on the page will observe keyboard events on the body and then
  // deliver them to their current key window.
  //
  // Returns the receiver.
  this.def('listen', function() {
    var self = this, container = this.container(), i, len;

    for (i = 0, len = appEvents.length; i < len; i++) {
      container.addEventListener(appEvents[i], processAppEvent, false);
    }

    this.__processBodyEvent__ = function(e) {
      return processBodyEvent.call(self, e);
    };

    for (i = 0, len = bodyEvents.length; i < len; i++) {
      document.body.addEventListener(bodyEvents[i],
                                     this.__processBodyEvent__, false);
    }
  });

  // Public: Stops listening for user events.
  //
  // Returns the receiver.
  this.def('stopListening', function() {
    var container = this.container(), i, len;

    for (i = 0, len = appEvents.length; i < len; i++) {
      container.removeEventListener(appEvents[i], processAppEvent, false);
    }

    for (i = 0, len = bodyEvents.length; i < len; i++) {
      document.body.removeEventListener(bodyEvents[i],
                                        this.__processBodyEvent__, false);
    }
  });

  // Public: Creates a new `Z.Window` object with the given view set to its
  // `contentView` property and adds it to the application's `windows` array. If
  // the application has already been started then the window is drawn and its
  // node is attached to the page.
  //
  // viewType - A `Z.View` sub-type to use as the window's `contentView`.
  // opts     - A native object containing options to pass to the `Z.Window`
  //            constructor (default: `{}`).
  //
  // Returns the new `Z.Window` concrete instance.
  this.def('createWindow', function(viewType, opts) {
    var window = Z.Window.create(viewType, Z.merge(opts || {}, {
      app: this, isMain: false
    }));

    this.windows().push(window);

    if (this.isStarted()) { attachWindow.call(this, window); }

    return window;
  });

  // Public: Destroys the given window and removes it from the `windows` array.
  //
  // window - The `Z.Window` object to destroy.
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

  // Public: Makes the given window the key window. This method will invoke the
  // `willResignKeyWindow` method on the current key window and
  // didBecomeKeyWindow` on the given key window.
  //
  // window - A `Z.Window` instance to make the new key window.
  //
  // Returns the receiver.
  this.def('makeKeyWindow', function(window) {
    var keyWindow = this.keyWindow(), windows = this.windows();

    if (!windows.contains(window)) {
      throw new Error(Z.fmt("%@.makeKeyWindow: attempted to make a window that doesn't belong to the application the key window",
                            this.typeName()));
    }

    if (keyWindow === window) { return this; }

    keyWindow.willResignKeyWindow();
    keyWindow.isKey(false);
    this.keyWindow(window);
    window.isKey(true);
    window.didBecomeKeyWindow();

    return this;
  });
});

