// Public: `Z.ContainerView` manages a single subview than can be easily changed
// by modifying its `contentView` or `nowShowing` properties. The `contentView`
// property must be set to a concrete `Z.View` instance. The `nowShowing`
// property can be set to any of the following:
//
//   * a view type
//   * a view instance
//   * a string that resolves to a view type or instance
//
// Setting `nowShowing` to any of the above will convert the value to a concrete
// view instance (if necessary) and set it as the value of `contentView`.
Z.ContainerView = Z.View.extend(function() {
  // Internal: The `nowShowing` property observer. When the `nowShowing`
  // property changes this method converts the value of a concrete `Z.View`
  // instance and sets that view as the value of the `contentView` property.
  function nowShowingDidChange() {
    var ns = this.nowShowing(), view = Z.isString(ns) ? Z.get(ns) : ns;

    if (view && !Z.isA(view, Z.View)) {
      throw new Error(Z.fmt("Z.ContainerView: `nowShowing` must be a Z.View: %@", ns));
    }

    this.contentView(view && view.isType ? view.create() : view);
  }

  // Internal: The `contentView` property observer. When the `contentView`
  // property changes this method swaps out the old with the new by calling the
  // `swapContentView` method.
  function contentViewDidChange() {
    var cv = this.contentView();

    if (cv && (!Z.isA(cv, Z.View) || cv.isType)) {
      throw new Error(Z.fmt("Z.ContainerView: `contentView` must be a Z.View instance: %@", cv));
    }

    this.swapContentView(this.get('subviews.first'), cv);
  }

  // Public: This property can be used to set the subview that the container
  // view is currently displaying. It can be set to a concrete Z.View instance,
  // a Z.View type, or a path to a Z.View instance or type.
  this.prop('nowShowing');

  // Public: The actual subview currently being displayed by the container view.
  // Its value is identical to the property path `subviews.first`.
  this.prop('contentView');

  // Public: Set this property to `false` to prevent the container view from
  // destroying views that get swapped out.
  this.prop('destroyOnRemove', {def: true});

  // Internal: The container view constructor - sets up observers on the
  // `nowShowing` and `contentView` properties.
  this.def('init', function(props) {
    this.on('didChange:nowShowing', nowShowingDidChange);
    this.on('didChange:contentView', contentViewDidChange);
    this.supr(props);
  });

  // Internal: The container view destructor - removes observes setup by the
  // `init` method.
  this.def('destroy', function() {
    this.off('didChange:contentView', contentViewDidChange);
    this.off('didChange:nowShowing', nowShowingDidChange);
    return this.supr();
  });

  // Public: Swaps out the old subview with the new subview. The default
  // implementation here simply removes the previous subview (if it exists),
  // destroys it if the `destroyOnRemove` property is set, and then adds the new
  // subview. This method may be overridden to implement custom behavior for
  // swaping the currently displayed view (e.g. to add an animation).
  //
  // oldView - The view being swapped out, may be `null`.
  // newView - The view being swapped in, may be `null`.
  //
  // Returns nothing.
  this.def('swapContentView', function(oldView, newView) {
    if (oldView) {
      oldView.remove();
      if (this.destroyOnRemove()) { oldView.destroy(); }
    }
    if (newView) { this.addSubview(newView); }
  });
});

