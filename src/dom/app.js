
Z.DOMApp = Z.Object.extend(function() {
  var events = [
    'blur',
    'change',
    'click',
    'dblclick',
    'focus',
    'focusin',
    'focusout',
    'hover',
    'keydown',
    'keypress',
    'keyup',
    'mousedown',
    'mouseenter',
    'mouseleave',
    'mousemove',
    'mouseout',
    'mouseup',
    'resize',
    'scroll',
    'select',
    'submit'
  ];

  function processEvent(event) {
    var node = event.target, view = Z.DOMView.viewForNode(node);
  }

  function attachWindow(window) {
    var container = this.container(), node = window.node();
    window.draw();
    container.appendChild(node);
  }

  function detachWindow(window) {
    this.container().removeChild(window.node());
  }

  this.prop('container', {
    get: function() {
      return this.__container__ = this.__container__ || document.body;
    }
  });

  this.prop('windows', {
    readonly: true,
    get: function() { return this.__windows__ = this.__windows__ || Z.A(); }
  });

  this.prop('mainWindow', {
    readonly: true,
    get: function() { return this.get('windows.first'); }
  });

  this.prop('isStarted', { def: false });

  this.prop('keyWindow');

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

  this.def('start', function() {
    var self = this;

    if (this.isStarted()) { return this; }

    this.keyWindow(this.mainWindow());
    this.listen();
    this.windows().each(function(window) { attachWindow.call(self, window); });
    this.isStarted(true);
    return this;
  });

  this.def('stop', function() {
    var self = this;

    if (!this.isStarted()) { return this; }

    this.set('keyWindow', null);
    this.windows().each(function(window) { detachWindow.call(self, window); });
    this.stopListening();
    this.isStarted(false);
    return this;
  });

  this.def('destroy', function() {
    var self = this, windows = this.windows(), mainWindow = windows.shift();
    this.stop();
    windows.invoke('destroy');
    mainWindow.destroy();
    return this;
  });

  this.def('listen', function() {
    var container = this.container(), len = events.length, i;

    for (i = 0; i < len; i++) {
      container.addEventListener(events[i], processEvent, false);
    }
  });

  this.def('stopListening', function() {
  });

  this.def('createWindow', function(viewType, opts) {
    var window = Z.DOMWindow.create(Z.merge(opts || {}, {
      app: this, isMain: false, contentView: viewType.create()
    }));

    this.windows().push(window);

    if (this.isStarted()) { attachWindow.call(this, window) }

    return window;
  });

  this.def('destroyWindow', function(window) {
    if (window === this.mainWindow()) {
      throw new Error(Z.fmt("%@.destroyWindow: can't destroy the main window",
                            this.typeName()));
    }

    window.destroy();
    this.windows().remove(window);

    return window;
  });

  this.def('dispatchMouseEvent', function(event) {
  });

  this.def('dispatchKeyEvent', function(event) {
  });
});

