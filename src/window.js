(function() {

Z.Window = Z.Object.extend(function() {
  this.prop('app');
  this.prop('isMain', { def: false });
  this.prop('isKey', { def: false });
  this.prop('view');
  this.prop('keyView');
  this.prop('level');
  this.prop('context', {
    get: function() {
      return this.__context__ = this.__context__ || this.buildContext();
    }
  });

  this.def('buildContext', function() {});

  this.def('draw', function() {
    this.view().draw();
    return this;
  });
});

}());

