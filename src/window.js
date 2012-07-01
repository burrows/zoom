(function() {

Z.Window = Z.View.extend(function() {
  this.prop('app');
  this.prop('isMain', { def: false });
  this.prop('isKey', { def: false });
  this.prop('contentView');
  this.prop('keyView');

  this.def('classes', function() {
    var classes = this.supr().concat('z-window');
    if (this.isMain()) { classes.push('z-main-window'); }
    return classes;
  });

  this.def('initialize', function(view, opts) {
    this.supr(opts);
    this.contentView(this.addSubview(view.isType ? view.create() : view));
  });

  this.def('becomeKeyWindow', function() {
    this.isKey(true);
    this.needsDisplay(true);
  });

  this.def('resignKeyWindow', function() {
    this.isKey(false);
    this.needsDisplay(true);
  });
});

}());

