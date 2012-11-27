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
    var content = this.content(), i, size;

    if (n.range) { i = n.range[0]; size = n.range[1]; }

    switch (n.type) {
      case 'change':
        this.contentItemsRemoved(0, this.subviews().size());
        if (content) { this.contentItemsInserted(content, 0); }
        break;
      case 'insert':
        this.contentItemsInserted(content.slice(i, size), i);
        break;
      case 'remove':
        this.contentItemsRemoved(i, size);
        break;
      case 'update':
        this.contentItemsRemoved(i, size);
        this.contentItemsInserted(content.slice(i, size), i);
        break;
    }
  }

  // Internal: Observes changes to the `itemViewType` property and replaces all
  // existing subviews with instances of the new item view type.
  function itemViewTypeDidChange() {
    var _this = this, type = this.itemViewType();
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
  this.def('contentItemsInserted', function(items, idx) {
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
});

