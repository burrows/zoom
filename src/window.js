(function() {

Z.Window = Z.View.extend(function() {
  this.prop('app');
  this.prop('isMain', { def: false });
  this.prop('isKey', { def: false });
  this.prop('contentView');
  this.prop('keyView');

  this.def('initialize', function(view, opts) {
    this.supr(opts);
    this.contentView(this.addSubview(view.isType ? view.create() : view));
  });

  this.def('buildNode', function() {
    var node = this.supr(), classes = ['z-window'];

    if (this.isMain()) { classes.push('z-main-window'); }

    node.className = node.className + ' ' + classes.join(' ');

    return node;
  });

  this.def('willResignKeyWindow', function() {});

  this.def('didBecomeKeyWindow', function() {});
});

}());

