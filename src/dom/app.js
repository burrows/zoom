(function() {

Z.DOMApp = Z.Object.extend(function() {
  this.prop('container', { def: document.body });

  this.prop('mainView');

  this.prop('windows', {
    readonly: true,
    get: function() { return this.__windows__ = this.__windows__ || Z.A(); }
  });

  this.prop('mainWindow');

  this.prop('keyWindow');

  this.def('start', function() {
    var window = Z.DOMWindow.create({
      app: this,
      contentView: this.mainView().create(),
      isMain: true,
      isKey: true
    });

    this.set('mainWindow', window);
    this.set('keyWindow', window);
    this.listen();

    window.attach();

    return this;
  });

  this.def('stop', function() {
    var self = this;
    this.windows.each(function(window) { self.destroyWindow(window); });
    this.set('mainWindow', null);
    this.set('keyWindow', null);
    this.stopListening();
  });

  this.def('listen', function() {
  });

  this.def('stopListening', function() {
  });

  this.def('createWindow', function(opts) {
    return this.windowType.create(Z.merge(opts || {}, {
      app: this, isMain: false
    }));
  });

  this.def('destroyWindow', function(window) {
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

