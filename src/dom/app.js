(function() {

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

    console.log(event.type, view.toString());
  }

  this.prop('container', { def: document.body });

  this.prop('windows', {
    readonly: true,
    get: function() { return this.__windows__ = this.__windows__ || Z.A(); }
  });

  this.prop('mainWindow', {
    readonly: true,
    get: function() { return this.get('windows.first'); }
  });

  this.prop('keyWindow');

  this.def('initialize', function(mainView, container) {
    if (!Z.isA(mainView, Z.DOMView)) {
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
    this.container().classList.add('z-app');
    this.set('keyWindow', this.mainWindow());
    this.listen();
    this.windows().invoke('attach');
    return this;
  });

  this.def('stop', function() {
    this.container().classList.remove('z-app');
    this.set('keyWindow', null);
    this.windows().invoke('detach');
    this.stopListening();
    return this;
  });

  this.def('destroy', function() {
    var windows = this.windows();
    this.stop();
    windows.invoke('destroy');
    windows.clear();
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

  this.def('createWindow', function(opts) {
    return Z.DOMWindow.create(Z.merge(opts || {}, {
      app: this, isMain: false
    }));
  });

  this.def('destroyWindow', function(window) {
    window.destroy();
    this.windows().remove(window);
  });

  this.def('moveWindowToTop', function(window) {
    this.windows().remove(window).push(window);
    this.windowStackOrderDidChange();
  });

  this.def('dispatchMouseEvent', function(event) {
  });

  this.def('dispatchKeyEvent', function(event) {
  });
});

}());

