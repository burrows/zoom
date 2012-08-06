// Public: `Z.ListView` displays an array of content objects as a list of
// subviews. Mutations made to the `content` property are observed and kept in
// sync with the view's `subviews` array. Each subview has its `content`
// property set to an item in the list view's `content` array.
//
// The view type to use for the subviews can be specified by overriding the
// `itemViewType` method.
//
// Examples:
//
//   MyItemView = Z.View.extend(function() {
//     this.prop('content');
//
//     this.def('displayPaths', function() {
//       return this.supr().concat('content');
//     });
//
//     this.def('tag', function() { return 'li'; });
//
//     this.def('render', function() {
//       this.node().innerHTML = this.content();
//     })
//   });
//
//   MyListView = Z.ListView.extend(function() {
//     this.def('tag', function() { return 'ul'; });
//
//     this.def('itemViewType', function() { return MyItemView; });
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
    var itemViewType = this.itemViewType(), i, size;

    for (i = 0, size = items.size(); i < size; i++) {
      this.addSubview(itemViewType.create({content: items.at(i)}), idx + i);
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

  // Public: A property pointing to an array of objects for the list view to
  // display. The list view observes changes to this property and automatically
  // syncs any changes to its `subviews` array.
  this.prop('content');

  // Internal: The list view constructor - adds an observer to the `content`
  // property and fires that observer in order to setup the initial state of the
  // `subviews` array.
  this.def('init', function(props) {
    this.supr(props);
    this.observe('content.@', this, contentObserver, {fire: true});
  });

  // Public: Overrides the default implementation of `destroy` to remove the
  // content observer.
  this.def('destroy', function() {
    this.stopObserving('content.@', this, contentObserver);
    this.supr();
  });

  // Public: Overrides the default implementation to return `ul` instead of
  // `div`. Subtypes may override this to use a tag other than `ul`.
  this.def('tag', function() { return 'ul'; });

  // Public: Returns the `Z.View` subtype to use for content item views. This
  // method must be overridden by subtypes.
  this.def('itemViewType', function() {
    throw new Error('Z.ListView.itemViewType: this method must be overridden by the sub-type');
  });
});

