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

  this.def('buildNode', function() {
    var node = this.supr();

    node.classList.add('z-window');
    if (this.isMain()) { node.classList.add('z-main-window'); }

    return node;
  });

  this.def('attach', function() {
    this.draw();
    this.get('app.container').appendChild(this.node());
  });
});

}());

