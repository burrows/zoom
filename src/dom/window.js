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
    var container = this.get('app.container'), node = this.node();
    this.draw();
    if (node.parentNode !== container) { container.appendChild(node); }
    return this;
  });

  this.def('detach', function() {
    var container = this.get('app.container'), node = this.node();
    if (node.parentNode === container) { container.removeChild(node); }
    return this;
  });
});

}());

