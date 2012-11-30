// The `Z.ArrayController` type provides an object for managing an array of
// objects. It provides methods for sorting, filtering, and maintaining
// a set of selected items.
//
// Examples
//
//   var content    = Z.A(5, 3, 7, 4, 1, 9, 2),
//       controller = Z.ArrayController.create({content: content});
//
//   // Filtering
//   controller.filterFn(function(x) { return x % 2 === 0; });
//   controller.arranged();          // => #<Z.Array:37 [4, 2]>
//
//   // Sorting
//   controller.filterFn(null);
//   controller.compareFn(Z.cmp);
//   controller.arranged();          // => #<Z.Array:37 [1, 2, 3, 4, 5, 7, 9]>
//
//   // Selection
//   controller.arranged();          // => #<Z.Array:37 [1, 2, 3, 4, 5, 7, 9]>
//   controller.selectItems([2, 5]);
//   controller.selection();         // => #<Z.Array:40 [2, 5]>
//   controller.selectionIndexes();  // => #<Z.Array:41 [1, 4]>
//   controller.unselectItem(5);
//   controller.selection();         // => #<Z.Array:40 [2]>
//   controller.selectionIndexes();  // => #<Z.Array:41 [1]>
//   controller.clearSelection();
//   controller.selection();         // => #<Z.Array:40 []>
//   controller.selectionIndexes();  // => #<Z.Array:41 []>
Z.ArrayController = Z.Object.extend(function() {
  // Internal: The `content` property observer. Syncs changes to the `content`
  // array to the `arranged` array.
  function contentObserver(n) {
    var _this = this;

    switch (n.type) {
      case 'change':
        this.clearSelection();
        rearrange.call(this);
        break;
      case 'insert':
        n.current.each(function(o) { insert.call(_this, o); });
        break;
      case 'remove':
        n.previous.each(function(o) { remove.call(_this, o); });
        break;
      case 'update':
        n.current.each(function(o) { insert.call(_this, o); });
        n.previous.each(function(o) { remove.call(_this, o); });
        break;
    }
  }

  // Internal: Inserts the given object into the given array in sorted order
  // according to the given comparator.
  //
  // o     - The object to insert.
  // array - The array to insert the object into.
  // cmp   - A comparator function.
  //
  // Returns nothing.
  function insertSorted(o, array, cmp) {
    var i = Z.binsearch(o, array, cmp);
    array.splice(i < 0 ? -i - 1 : i, 0, o);
  }

  // Internal: Inserts the given object into the `arranged` array. If a
  // `compareFn` property is set then the object is inserted in sorted order,
  // otherwise it is appended to the end of the array.
  //
  // o - The object to insert.
  //
  // Returns nothing.
  function insert(o) {
    var arranged = this.arranged(),
        cmp      = this.compareFn(),
        filter   = this.filterFn(),
        i;

    if (filter && !filter(o)) { return; }
    if (cmp) { insertSorted(o, arranged, cmp); }
    else { arranged.push(o); }
  }

  // Internal: Removes the given object from the `arranged` array.
  //
  // o - The object to insert.
  //
  // Returns nothing.
  function remove(o) {
    var arranged = this.arranged(), idx = arranged.index(o);
    if (idx === null) { return; }
    arranged.splice(idx, 1);
  }

  // Internal: Rearranges the `arranged` array based on the current `content`,
  // `filterFn` and `compareFn` properties and updates the `selectionIndexes`
  // property to reflect the new indexes of the currently selected items.
  //
  // Returns nothing.
  function rearrange() {
    var content   = this.content(),
        filterFn  = this.filterFn(),
        compareFn = this.compareFn(),
        arranged  = this.arranged(),
        indexes   = [];

    if (!content) {
      this.arranged().clear();
      this.clearSelection();
      return;
    }

    content = filterFn ? content.select(filterFn) : content.dup();

    if (compareFn) { content.sort$(compareFn); }

    this.arranged().replace(content);

    this.selection().each(function(item) {
      var idx = arranged.index(item);
      if (idx !== null) { indexes.push(idx); }
    });

    this.selectionIndexes().replace(indexes);
  }

  // Public: The `Z.Array` object to manage.
  this.prop('content');

  // Public: A `Z.Array` that contains the content items arranged according to
  // the `filterFn` and `compareFn` properties. Setting the content of a
  // `Z.ListView` to this property allows for easy sorting and filtering.
  this.prop('arranged', {
    readonly: true,
    get: function() { return this.__arranged__ = this.__arranged__ || Z.A(); }
  });

  // Public: A comparator function that is used to sort the `content` array.
  this.prop('compareFn');

  // Public: A function that is used to filter the `content` array.
  this.prop('filterFn');

  // Public: A boolean property indicating whether or not the controller should
  // allow multiple items to be selected at once. When `false` selecting an item
  // will cause the previously selected item to be unselected.
  this.prop('allowsMultipleSelection', {def: true});

  // Public: A `Z.Array` containing the currently selected content items.
  this.prop('selection', {
    readonly: true,
    get: function() {
      return this.__selection__ = this.__selection__ || Z.A();
    }
  });

  // Public: A `Z.Array` containing the indexes of the currently selected items
  // as they appear in the `arranged` array. Setting this property to the
  // `selectionIndexes` property of a `Z.ListView` allows for easy selection
  // managment.
  this.prop('selectionIndexes', {
    readonly: true,
    get: function() {
      return this.__selectionIndexes__ = this.__selectionIndexes__ || Z.A();
    },
  });

  // Internal: The `Z.ArrayController` constructor. Sets up property observers
  // and the initial state of the `arranged` array.
  this.def('init', function(props) {
    this.supr(props);
    this.observe('content.@', this, contentObserver,
      {previous: true, current: true});
    this.observe('compareFn', this, rearrange);
    this.observe('filterFn', this, rearrange);
    rearrange.call(this);
  });

  // Internal: The `Z.ArrayController` destructor.
  this.def('destroy', function() {
    this.stopObserving('content.@', this, contentObserver);
    this.stopObserving('compareFn', this, rearrange);
    this.stopObserving('filterFn', this, rearrange);
    return this.supr();
  });

  // Public: Selects the given item by adding it to the `selection` array and
  // its index in the `arranged` array to the `selectionIndexes` array. This
  // method will not allow selection of the same item multiple times.
  //
  // item - The item to select.
  //
  // Returns the receiver.
  this.def('selectItem', function(item) {
    var selection = this.selection(),
        indexes   = this.selectionIndexes(),
        arranged  = this.arranged(),
        idx       = arranged.index(item);

    if (selection.contains(item)) { return; }

    if (!this.allowsMultipleSelection()) { this.clearSelection(); }

    selection.push(item);
    if (idx !== null) { indexes.push(idx); }

    return this;
  });

  // Public: Selects all items in the given native array or `Z.Array`.
  //
  // items - A native array or `Z.Array` of content items to select.
  //
  // Returns the receiver.
  this.def('selectItems', function(items) {
    var _this = this;
    items = Z.isA(items, Z.Array) ? items : Z.Array.create(items);
    items.each(function(item) { _this.selectItem(item); });
    return this;
  });

  // Public: Unselects the given content item by removing it from the
  // `selection` array and its `arranged` array index from the
  // `selectionIndexes` array.
  //
  // item - The content item to unselect.
  //
  // Returns the receiver.
  this.def('unselectItem', function(item) {
    var selection = this.selection(),
        indexes   = this.selectionIndexes(),
        arranged  = this.arranged(),
        idx       = arranged.index(item);

    selection.remove(item);
    if (idx !== null) { indexes.remove(idx); }

    return this;
  });

  // Public: Unselects all items in the given native array or `Z.Array`.
  //
  // items - A native array or `Z.Array` of content items to unselect.
  //
  // Returns the receiver.
  this.def('unselectItems', function(items) {
    var _this = this;
    items = Z.isA(items, Z.Array) ? items : Z.Array.create(items);
    items.each(function(item) { _this.unselectItem(item); });
    return this;
  });

  // Public: Clears the selection by clearing both the `selection` and
  // `selectionIndexes` arrays.
  //
  // Returns the receiver.
  this.def('clearSelection', function() {
    this.selection().clear();
    this.selectionIndexes().clear();
    return this;
  });
});

