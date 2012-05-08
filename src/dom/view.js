(function(undefined) {

Z.DOMView = Z.Object.extend(function() {
  var viewClassRe, views;

  // Internal: A regular expression for matching against a DOM element's
  // `className` property to determine if the element is a view's node.
  viewClassRe = /(^|\s)z-view(\s|$)/;
  
  // Internal: A cache of concrete view instances. Every `Z.DOMView` object that
  // gets created is added to this cache keyed by its `objectId`. This cache is
  // used by the `viewForNode` method to look up a view instance based on a DOM
  // node. When views are destroyed they are removed from this cache.
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
    this.subviews().invoke('draw');
    return this;
  });

  this.def('handleEvent', function(event) {
    return false;
  });

  // Public: Indicates whether the receiver is a descendant of the given view.
  //
  // view - A concreate `Z.DOMView` instance.
  //
  // Returns a Boolean.
  this.def('isDescendantOf', function(view) {
    var v = this.superview();

    while (v && v !== view) { v = v.superview(); }

    return v === view;
  });

  // Public: Indicates whether the receiver is an ancestor of the given view.
  //
  // view - A concreate `Z.DOMView` instance.
  //
  // Returns a Boolean.
  this.def('isAncestorOf', function(view) {
    return view.isDescendantOf(this);
  });

  // Public: Removes the receiver from its superview, thereby removing it from
  // the document.
  //
  // Returns the receiver.
  this.def('remove', function() {
    var superview = this.superview();
    if (superview) { superview.removeSubview(this); }
    return this;
  });

  // Public: Adds the given view as a subview of the receiver. This will add the
  // view to the receiver's `subviews` array and insert its node as a child node
  // of the receiver's `node`.
  //
  // If the given view is already a subview of another view, it is first removed
  // from that superview before adding it to the receiver.
  //
  // view - A concrete view instance to add as the subview.
  // idx  - The index to add the subview at (default: append to end of
  //        `subviews` array.
  //
  // Returns `view`.
  // Throws `Error` if given an invalid index.
  this.def('addSubview', function(view, idx) {
    var subviews = this.subviews(), node = this.node();

    if (view.superview()) { view.remove(); }
    if (idx === undefined) { idx = subviews.size(); }

    if (idx < 0 || idx > subviews.size()) {
      throw new Error(Z.fmt("Z.DOMView.addSubview: invalid index (%@) for: %@",
                            idx, this));
    }

    subviews.splice(idx, 0, view);
    view.superview(this);

    node.insertBefore(view.node(), node.childNodes[idx] || null);

    return view;
  });

  // Public: Adds the given view as a subview and inserts it into the `subviews`
  // array just before the reference view.
  //
  // refView - The reference view to add the new view before.
  // newView - The view to add as a subview.
  //
  // Returns `newView`.
  // Throws `Error` if `refView` is not currently a subview.
  this.def('addSubviewBefore', function(refView, newView) {
    var idx = this.subviews().index(refView);

    if (idx === null) {
      throw new Error('Z.DOMView.addSubviewBefore: reference view is not a subview: ' + this.toString());
    }

    return this.addSubview(newView, idx);
  });

  // Public: Adds the given view as a subview and inserts it into the `subviews`
  // array just after the reference view.
  //
  // refView - The reference view to add the new view before.
  // newView - The view to add as a subview.
  //
  // Returns `newView`.
  // Throws `Error` if `refView` is not currently a subview.
  this.def('addSubviewAfter', function(refView, newView) {
    var idx = this.subviews().index(refView);

    if (idx === null) {
      throw new Error('Z.DOMView.addSubviewAfter: reference view is not a subview: ' + this.toString());
    }

    return this.addSubview(newView, idx + 1);
  });

  // Public: Replaces an existing subview with a new subview.
  //
  // oldView - The current subview to replace.
  // newView - The new subview to replace the old subview.
  //
  // Returns `newView`.
  // Throws `Error` if `oldView` is not currently a subview.
  this.def('replaceSubview', function(oldView, newView) {
    var idx = this.subviews().index(oldView);

    if (idx === null) {
      throw new Error('Z.DOMView.replaceSubview: old view is not a subview: ' + this.toString());
    }

    this.removeSubview(oldView);
    return this.addSubview(newView, idx);
  });

  // Public: Removes the given subview from the receiver's `subviews` array and
  // set's its `superview` property to `null`.
  //
  // view - The view to remove.
  //
  // Returns the receiver.
  // Throws `Error` if the given view is not a subview.
  this.def('removeSubview', function(view) {
    var idx = this.subviews().index(view);

    if (idx === null) {
      throw new Error(Z.fmt("Z.DOMView.removeSubview: given view is not a subview: %@",
                            view));
    }

    this.subviews().splice(idx, 1);
    view.superview(null);
    this.node().removeChild(view.node());

    return this;
  });
});

}());


