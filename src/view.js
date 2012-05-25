(function(undefined) {

Z.View = Z.Object.extend(function() {
  var viewClassRe, views;

  // Internal: A regular expression for matching against a DOM element's
  // `className` property to determine if the element is a view's node.
  viewClassRe = /(^|\s)z-view(\s|$)/;
  
  // Internal: A cache of concrete view instances. Every `Z.View` object that
  // gets created is added to this cache keyed by its `objectId`. This cache is
  // used by the `viewForNode` method to look up a view instance based on a DOM
  // node. When views are destroyed they are removed from this cache.
  views = {};

  // Public: A property holding the DOM node managed by the view.
  this.prop('node', {
    readonly: true,
    get: function() {
      return this.__node__ = this.__node__ || this.buildNode();
    }
  });

  // Public: A property holding the view's superview.
  this.prop('superview');

  // Public: A property holding the array of subviews belonging to the view.
  // This property should not be manipulated directly, instead use the
  // `addSubview` and `removeSubview` methods.
  this.prop('subviews', {
    readonly: true,
    get: function() { return this.__subviews__ = this.__subviews__ || Z.A(); }
  });

  // Public: Boolean property indicating whether the view needs it's `display`
  // method run in order to sync its state to the DOM.
  this.prop('needsDisplay', { def: true });

  // Public: Returns the HTML tag to use when building the `node` for instances
  // of the view. Override this method to generate a `node` that is something
  // other than a div.
  //
  // Returns a string representing the type of DOM node to use.
  this.def('tag', function() { return 'div'; });

  // Public: Returns the `Z.View` instance that owns the given node.
  //
  // node - A DOM element reference.
  //
  // Returns a `Z.View` instance or `null` if the node doesn't belong to a
  //   view.
  this.def('viewForNode', function(node) {
    while (node && !viewClassRe.test(node.className)) {
      node = node.parentNode;
    }

    return node ? (views[node.id.replace('z-view-', '')] || null) : null;
  });

  // Internal: Adds the new view instance to the internal cache used by the
  // `viewForNode` method.
  this.def('initialize', function(props) {
    this.supr(props);
    views[this.objectId()] = this;
  });

  // Public: Destroys the view by removing it from its `superview` and
  // recursively calling `destroy` on all `subviews`. The view instance is also
  // removed from the internal cache used by `viewForNode`.
  //
  // Returns the receiver.
  this.def('destroy', function() {
    var subviews = this.subviews().slice();

    delete views[this.objectId()];
    this.remove();
    subviews.invoke('destroy');

    return this;
  });

  // Public: Builds the view's DOM node but does not attach it to the document.
  // Creation of the node can be customized by overriding this method. Be sure
  // to invoke `supr` when overriding to allow this method to actualy create the
  // node as it adds `class` and `id` attributes the rest of the view system
  // expects to be present.
  //
  // Returns the DOM node.
  this.def('buildNode', function() {
    var id   = 'z-view-' + this.objectId(),
        node = document.createElement(this.tag());

    node.id = id;
    node.className = 'z-view';
    views[id] = this;

    return node;
  });

  // Public: Renders the view into its node. By default this method does
  // nothing, but sub types of `Z.View` can override it in order to implement
  // a custom view's rendering logic.
  //
  // Returns the receiver.
  this.def('render', function() { return this; });

  // Public: Simply invokes the `display` method if the `needsDisplay` property
  // is `true` and does nothing otherwise.
  //
  // Returns the receiver.
  this.def('displayIfNeeded', function() {
    if (this.needsDisplay()) { this.display(); }
    return this;
  });

  // Public: Displays the receiver by invoking the `render` method and
  // recursively calling `display` on any subviews that are in need of display.
  //
  // This method is where all DOM modification actually occurs and should
  // rarely, if ever, need to be called directly. Instead, view displays are
  // triggered by `Z.RunLoop`.
  //
  // Returns the receiver.
  this.def('display', function() {
    var node = this.node(), subviews = this.subviews(),
        subview, removed, i, size, refnode;

    this.render();

    // ensure that all removed subviews have had their nodes detached
    if (removed = this.__removedSubviews__) {
      for (i = 0, size = removed.length; i < size; i++) {
        if (removed[i].node().parentNode === node) {
          node.removeChild(removed[i].node());
        }
      }
      this.__removedSubviews__ = null;
    }

    // display current subviews
    for (i = subviews.size() - 1; i >= 0; i--) {
      subview = subviews.at(i);
      subview.displayIfNeeded();
      if (subview.node().parentNode !== node) {
        refnode = subviews.at(i + 1) ? subviews.at(i + 1).node() : null;
        node.insertBefore(subview.node(), refnode);
      }
    }

    // mark this view as no longer needing display, so subsequent runs of the
    // run loop will no longer re-display it
    this.needsDisplay(false);

    return this;
  });

  this.def('handleEvent', function(event) {
    return false;
  });

  // Public: Indicates whether the receiver is a descendant of the given view.
  //
  // view - A concreate `Z.View` instance.
  //
  // Returns a Boolean.
  this.def('isDescendantOf', function(view) {
    var v = this.superview();

    while (v && v !== view) { v = v.superview(); }

    return v === view;
  });

  // Public: Indicates whether the receiver is an ancestor of the given view.
  //
  // view - A concreate `Z.View` instance.
  //
  // Returns a Boolean.
  this.def('isAncestorOf', function(view) {
    return view.isDescendantOf(this);
  });

  // Public: Adds the given view as a subview of the receiver. This will add the
  // view to the receiver's `subviews` array and mark the given view as needing
  // display.
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
    var subviews = this.subviews();

    if (view.superview()) { view.remove(); }
    if (idx === undefined) { idx = subviews.size(); }

    if (idx < 0 || idx > subviews.size()) {
      throw new Error(Z.fmt("Z.View.addSubview: invalid index (%@) for: %@",
                            idx, this));
    }

    subviews.splice(idx, 0, view);
    view.superview(this);
    this.needsDisplay(true);

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
      throw new Error('Z.View.addSubviewBefore: reference view is not a subview: ' + this.toString());
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
      throw new Error('Z.View.addSubviewAfter: reference view is not a subview: ' + this.toString());
    }

    return this.addSubview(newView, idx + 1);
  });

  // Public: Replaces an existing subview with a new subview and marks the
  // receiver as needing display.
  //
  // oldView - The current subview to replace.
  // newView - The new subview to replace the old subview.
  //
  // Returns `newView`.
  // Throws `Error` if `oldView` is not currently a subview.
  this.def('replaceSubview', function(oldView, newView) {
    var idx = this.subviews().index(oldView);

    if (idx === null) {
      throw new Error('Z.View.replaceSubview: old view is not a subview: ' + this.toString());
    }

    this.removeSubview(oldView);
    return this.addSubview(newView, idx);
  });

  // Public: Removes the given subview from the receiver's `subviews` array,
  // set's its `superview` property to `null`, and marks the receiver as needing
  // display. A number representing the index of a subview can be passed instead
  // of a reference to the view itself.
  //
  // view - The view to remove or a number indicating the index of the view to
  //        remove.
  //
  // Returns the receiver.
  // Throws `Error` if the given view is not a subview.
  // Throws `Error` if the given index is not in range.
  this.def('removeSubview', function(view) {
    var subviews = this.subviews(), size = subviews.size(), idx;

    if (typeof view === 'number') {
      idx  = view;
      view = subviews.at(idx);
    }
    else {
      idx = subviews.index(view);
    }

    if (idx === null) {
      throw new Error(Z.fmt("Z.View.removeSubview: given view is not a subview: %@", view));
    }

    if (idx < 0 || idx >= size) {
      throw new Error(Z.fmt("Z.View.removeSubview: given index (%@) is not in range", idx));
    }

    subviews.splice(idx, 1);
    view.superview(null);
    this.needsDisplay(true);

    (this.__removedSubviews__ = this.__removedSubviews__ || []).push(view);

    return this;
  });

  // Public: Removes the receiver from its superview.
  //
  // Returns the receiver.
  this.def('remove', function() {
    var superview = this.superview();
    if (superview) { superview.removeSubview(this); }
    return this;
  });
});

}());

