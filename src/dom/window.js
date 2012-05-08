(function() {

Z.DOMWindow = Z.DOMView.extend(function() {
  this.prop('app');
  this.prop('isMain', { def: false });
  this.prop('isKey', { def: false });
  this.prop('contentView', {
    get: function() { return this.get('subviews.first'); },
    set: function(view) { return this.addSubview(view, 0); }
  });
  this.prop('keyView');

  this.def('initialize', function(viewType, opts) {
    this.supr(opts);
    this.contentView(viewType.create());
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

