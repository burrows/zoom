(function(undefined) {

Z.DOMView = Z.Object.extend(function() {
  var viewClassRe, views;

  // Internal: A regular expression for matching against a DOM element's
  // `className` property to determine if the element is a view's node.
  viewClassRe = /(^|\s)z-view(\s|$)/;
  
  // Internal: A cache of concrete view instances. Every `Z.DOMView` object that
  // gets created is added to this object keyed by its `objectId`. This cache is
  // used by the `viewForNode` method to look up a view instance based on a DOM
  // node. When views are destroyed, they are removed from this cache.
  views = {};

  this.prop('tag', { def: 'div' });

  this.prop('node');

  this.prop('superview');

  this.prop('subviews', {
    get: function() { return this.__subviews__ = this.__subviews__ || Z.A(); }
  });

  // Public: Returns the `Z.DOMView` instance that owns the given node.
  //
  // node - A DOM element reference.
  //
  // Returns a `Z.DOMView` instance or `null` if the node doesn't belong to a
  //   view.
  this.def('viewForNode', function(node) {
    while (node && !viewClassRe.test(node.className)) {
      node = node.parentNode;
    }

    return node ? (views[node.id.replace('z-view-', '')] || null) : null;
  });

  this.def('initialize', function(props) {
    this.supr(props);
    views[this.objectId()] = this;
    this.set('node', this.buildNode());
  });

  this.def('destroy', function() {
    var node = this.node();
    if (node.parentNode) { node.parentNode.removeChild(node); }
    this._destroy();
  });

  this.def('_destroy', function() {
    this.subviews().invoke('_destroy');
    delete views[this.objectId()];
    this.set('node', null);
  });

  this.def('buildNode', function() {
    var id   = 'z-view-' + this.objectId(),
        node = document.createElement(this.tag());

    node.id = id;
    node.className = 'z-view';
    views[id] = this;

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

  this.def('handleEvent', function(event) {
    return false;
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


