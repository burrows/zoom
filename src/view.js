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

(function(idx) {

Z.View = Z.Object.extend(function() {
  this.prop('superview');

  this.prop('subviews', {
    get: function() { return this.__subviews__ = this.__subviews__ || Z.A(); }
  });

  this.prop('context', {
    get: function() {
      return this.__context__ = this.__context__ || this.buildContext();
    }
  });

  this.def('draw', function() {
    this.subviews().invoke('draw');
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
});

}());
