// Public: `Z.ListView` displays an array of content objects as a list of
// subviews. Mutations made to the `content` property are observed and kept in
// sync with the view's `subviews` array. Each subview has its `content`
// property set to an item in the list view's `content` array.
//
// The view type to use for the subviews can be specified with the
// `itemViewType` property.
//
// Examples:
//
//   MyItemView = Z.View.extend(function() {
//     this.tag = 'li';
//
//     this.prop('content');
//
//     this.def('displayPaths', function() {
//       return this.supr().concat('content');
//     });
//
//     this.def('render', function() {
//       this.node.innerHTML = this.content();
//     })
//   });
//
//   MyListView = Z.ListView.extend(function() {
//     this.tag = 'ul';
//     this.itemViewType(MyItemView);
//   });
//
//   MyListView.create({content: ['foo', 'bar', 'baz']});
Z.ListView = Z.View.extend(function() {
  // Internal: The `content` mutation observer. This function is invoked
  // whenever the `content` property is mutated or changed and syncs the current
  // state of the `content` to the view's `subviews` array..
  //
  // n - A notification object.
  //
  // Returns nothing.
  function contentObserver(n) {
    var content      = this.content(),
        isEmpty      = !content || (content.size() === 0),
        showingEmpty = this.showingEmpty(),
        hasEmpty     = !!this.emptyView(),
        i, size;

    if (n.range) { i = n.range[0]; size = n.range[1]; }

    if (!isEmpty && showingEmpty) { this.removeEmptyView(); }

    switch (n.type) {
      case 'change':
        if (this.__prevContent__ && this.__prevContent__.size() > 0) {
          this.contentItemsRemoved(0, this.__prevContent__.size());
        }

        if (content && content.size() > 0) {
          this.contentItemsAdded(content, 0);
        }

        this.__prevContent__ = content;
        break;
      case 'insert':
        this.contentItemsAdded(content.slice(i, size), i);
        break;
      case 'remove':
        this.contentItemsRemoved(i, size);
        break;
      case 'update':
        this.contentItemsRemoved(i, size);
        this.contentItemsAdded(content.slice(i, size), i);
        break;
    }

    if (isEmpty && !showingEmpty && hasEmpty) { this.addEmptyView(); }
  }

  // Internal: Observes changes to the `itemViewType` property and replaces all
  // existing subviews with instances of the new item view type.
  function itemViewTypeObserver() {
    var _this = this, type = this.itemViewType();
    if (this.showingEmpty()) { return; }
    this.subviews().each(function(sv) {
      _this.replaceSubview(sv, _this.createItemView(type, sv.content()));
    });
  }

  // Public: `Z.ListView` instances generate a `ul` node by default. Subtypes
  // can set this property to use a tag other than `ul`.
  this.tag = 'ul';

  // Public: A property pointing to a `Z.Array` of objects for the list view to
  // display. The list view observes changes to this property and automatically
  // syncs any changes to its `subviews` array.
  this.prop('content');

  // Public: The `Z.View` subtype to use for content item views. This must be
  // specified in sub-types and must have a `content` property.
  this.prop('itemViewType');

  // Public: A property holding an array of the indexes of the view's currently
  // selected content items.
  this.prop('selectionIndexes', {
    get: function() {
      return this.__selectionIndexes__ = this.__selectionIndexes__ || Z.A();
    },
    set: function(v) {  return this.__selectionIndexes__ = v; }
  });

  // Public: A `Z.View` concrete instance to display when `content` is `null`
  // or empty.
  this.prop('emptyView');

  // Public: A boolean property indicating whether or not the empty view is
  // currently being displayed.
  this.prop('showingEmpty', {def: false});

  // Internal: The list view constructor - adds an observer to the `content`
  // property and fires that observer in order to setup the initial state of the
  // `subviews` array.
  this.def('init', function(props) {
    this.supr(props);
    this.observe('content.@', this, contentObserver, {fire: true});
    this.observe('itemViewType', this, itemViewTypeObserver);
  });

  // Public: Overrides the default implementation of `destroy` to remove the
  // content observer.
  this.def('destroy', function() {
    this.stopObserving('content.@', this, contentObserver);
    this.stopObserving('itemViewType', this, itemViewTypeObserver);
    this.supr();
  });

  // Internal: Returns a list of property paths that trigger this view to update
  // itself.
  this.def('displayPaths', function() {
    return this.supr().concat('selectionIndexes.@');
  });

  // Internal: Updates the list view by marking the currently selected subviews.
  this.def('update', function() {
    this.applySelections(this.selectionIndexes());
  });

  // Public: Creates a new item view instance. Override this method if you want
  // to customize how item views are created.
  //
  // type - The `Z.View` subtype to use as the
  // item - The object to set as the `content` property on the item view.
  //
  // Returns the item view instance.
  this.def('createItemView', function(type, item) {
    if (!type) {
      throw new Error(Z.fmt("Z.ListView.createItemView: `itemViewType` is not defined: %@", this));
    }

    return type.create({content: item});
  });

  // Internal: Invoked when items are added to the `content` property.
  //
  // items - An array containing the content items inserted.
  // idx   - The index of `content` where the items were inserted.
  //
  // Returns the receiver..
  this.def('contentItemsAdded', function(items, idx) {
    var type = this.itemViewType(), i, size;

    for (i = 0, size = items.size(); i < size; i++) {
      this.addSubview(this.createItemView(type, items.at(i)), idx + i);
    }

    return this;
  });

  // Internal: Invoked when items are removed from the `content` property.
  //
  // idx - The index of `content` that marks the beginning of the range of
  //       removed items.
  // n   - The total number of items removed.
  //
  // Returns the receiver.
  this.def('contentItemsRemoved', function(idx, n) {
    var i;
    for (i = idx + n - 1; i >= idx; i--) { this.removeSubview(i).destroy(); }
    return this;
  });

  // Public: Returns the subview that is managing the content item at the given
  // index.
  //
  // idx - An integer representing a content item index.
  //
  // Returns a subview if one exists for the given index and `null` otherwise.
  this.def('subviewForContentIndex', function(idx) {
    return this.subviews().at(idx);
  });

  // Internal: Syncs each subview's `isSelected` property with the given
  // selection indexes.
  //
  // selectionIndexes - The indexes of the currently selected content items.
  //
  // Returns the receiver.
  this.def('applySelections', function(selectionIndexes) {
    var _this = this;

    this.subviews().set('isSelected', false);
    selectionIndexes.each(function(idx) {
      var sv = _this.subviewForContentIndex(idx);
      if (sv) { sv.isSelected(true); }
    });

    return this;
  });

  // Internal: Adds the `emptyView` property as a subview if it is set and sets
  // the `showingEmpty` property. This method is invoked by the content observer
  // and should not be called by client code.
  //
  // Returns the receiver.
  this.def('addEmptyView', function() {
    var emptyView = this.emptyView();

    if (emptyView) {
      this.addSubview(emptyView);
      this.showingEmpty(true);
    }

    return this;
  });

  // Internal: Removes the `emptyView` from the `subviews` array and unsets the
  // `showingEmpty` property. This method is invoked by the content observer
  // and should not be called by client code.
  //
  // Returns the receiver.
  this.def('removeEmptyView', function() {
    var emptyView = this.emptyView();

    if (emptyView && emptyView.superview() === this) {
      this.removeSubview(emptyView);
      this.showingEmpty(false);
    }

    return this;
  });
});

