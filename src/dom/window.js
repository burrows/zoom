(function() {

Z.DOMWindow = Z.DOMView.extend(function() {
  this.prop('app');
  this.prop('isMain', { def: false });
  this.prop('isKey', { def: false });
  this.prop('contentView', {
    get: function() { return this.get('subviews.first'); },
    set: function(view) { return this.subviews().at(0, view); }
  });
  this.prop('keyView');

  this.def('initialize', function(viewType, opts) {
    this.supr(Z.merge(opts || {}, {
      contentView: viewType.create({superview: this})
    }));
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

