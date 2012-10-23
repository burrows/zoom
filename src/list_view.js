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
  // Internal: Creates new item views for the given items and inserts them into
  // the `subviews` array starting at the given index.
  //
  // items - An array of content items.
  // idx   - The index in the `subviews` array to insert the new item views.
  //
  // Returns nothing.
  function insertItemViews(items, idx) {
    var i, size;

    for (i = 0, size = items.size(); i < size; i++) {
      this.addSubview(this.createItemView(items.at(i)), idx + i);
    }
  }

  // Internal: Removes `n` subviews starting at index `idx`.
  //
  // idx - The starting index of `subviews` to begin removing subviews.
  // n   - The total number of subviews to remove.
  //
  // Returns nothing.
  function removeItemViews(idx, n) {
    for (var i = idx + n - 1; i >= idx; i--) {
      this.removeSubview(i).destroy();
    }
  }

  // Internal: The `content` mutation observer. This function is invoked
  // whenever the `content` property is mutated or changed and syncs the current
  // state of the `content` to the view's `subviews` array..
  //
  // n - A notification object.
  //
  // Returns nothing.
  function contentObserver(n) {
    var content = this.content(), i, size;

    if (n.range) { i = n.range[0]; size = n.range[1]; }

    switch (n.type) {
      case 'change':
        removeItemViews.call(this, 0, this.subviews().size());
        if (content) { insertItemViews.call(this, content, 0); }
        break;
      case 'insert':
        insertItemViews.call(this, content.slice(i, size), i);
        break;
      case 'remove':
        removeItemViews.call(this, i, size);
        break;
      case 'update':
        removeItemViews.call(this, i, size);
        insertItemViews.call(this, content.slice(i, size), i);
        break;
    }
  }

  // Internal: Observes changes to the `itemViewType` property and replaces all
  // existing subviews with instances of the new item view type.
  function itemViewTypeDidChange() {
    var self = this;
    this.subviews().each(function(sv) {
      self.replaceSubview(sv, self.createItemView(sv.content()));
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

  // Internal: The list view constructor - adds an observer to the `content`
  // property and fires that observer in order to setup the initial state of the
  // `subviews` array.
  this.def('init', function(props) {
    this.supr(props);
    this.observe('content.@', this, contentObserver, {fire: true});
    this.observe('itemViewType', this, itemViewTypeDidChange);
  });

  // Public: Overrides the default implementation of `destroy` to remove the
  // content observer.
  this.def('destroy', function() {
    this.stopObserving('content.@', this, contentObserver);
    this.stopObserving('itemViewType', this, itemViewTypeDidChange);
    this.supr();
  });

  // Public: Creates a new item view instance. Override this method if you want
  // to customize how item views are created.
  //
  // content - The object to set as the `content` property on the item view.
  //
  // Returns the item view instance.
  this.def('createItemView', function(content) {
    var type = this.itemViewType();

    if (!type) {
      throw new Error(Z.fmt("Z.ListView.createItemView: `itemViewType` is not defined: %@", this));
    }

    return type.create({content: content});
  });
});

