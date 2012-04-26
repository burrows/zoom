(function() {

Z.App = Z.Object.extend(function() {
  this.prop('mainView');

  this.prop('windows', {
    readonly: true,
    get: function() { return this.__windows__ = this.__windows__ || Z.A(); }
  });

  this.prop('mainWindow');
  this.prop('keyWindow');

  this.def('start', function() {
    var window = this.windowType.create({
      app: this,
      view: this.mainView().create(),
      isMain: true,
      isKey: true
    });

    this.set('mainWindow', window);
    this.set('keyWindow', window);
    this.listen();
    window.draw();

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
    throw new Error(Z.fmt("%@.listen: must implement in sub-type", this.typeName()));
  });

  this.def('stopListening', function() {
    throw new Error(Z.fmt("%@.stopListening: must implement in sub-type", this.typeName()));
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

