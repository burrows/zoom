// properties:
//
// * superview
// * subviews
// * node
//
// methods:
//
// * draw
// * remove
// * isDescendantOf(view)
// * isAncestorOf(view)
// * removeSubview(view)
// * addSubview(view, idx)
// * addSubviewBefore(curView, newView)
// * addSubviewAfter(curView, newView)
// * replaceSubview(oldView, newView)
//
// * didRemoveSubview(view)
// * didAddSubview(view)
(function(undefined) {

Z.DOMView = Z.Object.extend(function() {
  this.prop('tag', { def: 'div' });

  this.prop('node');

  this.prop('superview');

  this.prop('subviews', {
    get: function() { return this.__subviews__ = this.__subviews__ || Z.A(); }
  });

  this.def('initialize', function(props) {
    this.supr(props);
    this.set('node', this.buildNode());
  });

  this.def('buildNode', function() {
    var node = document.createElement(this.tag());
    node.id = 'z-view-' + this.objectId();
    node.classList.add('z-view');
    return node;
  });

  this.def('draw', function() {
    var node = this.node();

    this.subviews().each(function(subview) {
      var child = subview.node();
      subview.draw();
      if (!child.parentNode) { node.appendChild(subview.node()); }
    });

    return this;
  });

  this.def('isDescendantOf', function(view) {
    var v = this.superview();

    while (v && v !== view) { v = v.superview(); }

    return v === view;
  });

  this.def('isAncestorOf', function(view) {
    return view.isDescendentOf(this);
  });

  this.def('remove', function() {
    var superview = this.superview();

    if (!superview) { return; }

    superview.removeSubview(this);
  });

  this.def('removeSubview', function(view) {
    var idx = this.subviews().index(view);

    if (idx === null) {
      throw new Error(Z.fmt("%@.removeSubview: view does not exist in `subviews` array: %@",
                           this.typeName(), view));
    }

    this.willRemoveSubview(view);
    this.subviews().splice(idx, 1);
    view.superview(null);
  });

  this.def('addSubview', function(view, idx) {
    if (idx === undefined) { idx = this.subviews.size(); }

    if (view.superview()) { view.remove(); }
    this.subviews().splice(idx, 0, view);
    this.didAddSubview(view, idx);
  });

  this.def('addSubviewBefore', function(curView, newView) {
    var idx = this.subviews().index(curView);
    this.addSubview(newView, idx);
  });

  this.def('addSubviewAfter', function(curView, newView) {
    var idx = this.subviews().index(curView);
    this.addSubview(newView, idx + 1);
  });

  this.def('replaceSubview', function(oldView, newView) {
    var idx = this.subviews().index(oldView);
    this.removeSubview(oldView);
    this.addSubview(newView, idx);
  });

  this.def('willRemoveSubview', function(view) {});

  this.def('didAddSubview', function(view, idx) {});

  //this.def('willRemoveSubview', function(subview, idx) {
  //  this.supr(subview, idx);
  //  subview.context().remove();
  //});

  //this.def('didAddSubview', function(subview, idx) {
  //  var context = this.context();

  //  this.supr(subview, idx);
  //  subview.draw(); // FIXME: only if dirty

  //  if (idx === 0) { context.prepend(subview.context()); }
  //  else { context.children().eq(idx - 1).after(subview.context()); }
  //});
});

}());


