// TODO:
// selectionIndexes property (array of indexes)
// selection property (array of selected objects)
// selectItem(item) - adds to selectionIndexes
// unselectItem(item) - removes from selectionIndexes
// clearSelection()
// allowsMultipleSelection - boolean
Z.ArrayController = Z.Object.extend(function() {
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

  function index(o) {
    var arranged = this.arranged(), cmp = this.compareFn(), idx;

    if (cmp) {
      idx = Z.binsearch(o, arranged, cmp);
      return idx >= 0 ? idx : null;
    }
    else {
      return arranged.index(o);
    }

    return cmp ? Z.binsearch(o, arranged, cmp) : arranged.index(o);
  }

  function insertSorted(o, array, cmp) {
    var i = Z.binsearch(o, array, cmp);
    array.splice(i < 0 ? -i - 1 : i, 0, o);
  }

  function insert(o) {
    var arranged = this.arranged(),
        cmp      = this.compareFn(),
        filter   = this.filterFn(),
        i;

    if (filter && !filter(o)) { return; }
    if (cmp) { insertSorted(o, arranged, cmp); }
    else { arranged.push(o); }
  }

  function remove(o) {
    var arranged = this.arranged(), idx = index.call(this, o);
    if (idx === null) { return; }
    arranged.splice(idx, 1);
  }

  function rearrange() {
    var _this     = this,
        content   = this.content(),
        filterFn  = this.filterFn(),
        compareFn = this.compareFn(),
        indexes   = [];

    if (!content) {
      this.arranged(null);
      this.clearSelection();
      return;
    }

    content = filterFn ? content.select(filterFn) : content.dup();

    if (compareFn) { content.sort$(compareFn); }

    this.arranged(content);

    this.selection().each(function(item) {
      var idx = index.call(_this, item);
      if (idx !== null) { indexes.push(idx); }
    });

    this.selectionIndexes().replace(indexes);
  }

  this.prop('content');

  this.prop('arranged');

  this.prop('compareFn');

  this.prop('filterFn');

  this.prop('allowsMultipleSelection', {def: true});

  this.prop('selection', {
    readonly: true,
    get: function() {
      return this.__selection__ = this.__selection__ || Z.A();
    }
  });

  this.prop('selectionIndexes', {
    readonly: true,
    get: function() {
      return this.__selectionIndexes__ = this.__selectionIndexes__ || Z.A();
    },
  });

  this.def('init', function(props) {
    this.supr(props);
    this.observe('content.@', this, contentObserver,
      {previous: true, current: true});
    this.observe('compareFn', this, rearrange);
    this.observe('filterFn', this, rearrange);
    rearrange.call(this);
  });

  this.def('destroy', function() {
    this.stopObserving('content.@', this, contentObserver);
    this.stopObserving('compareFn', this, rearrange);
    this.stopObserving('filterFn', this, rearrange);
    return this.supr();
  });

  this.def('selectItem', function(item) {
    var selection = this.selection(),
        indexes   = this.selectionIndexes(),
        idx       = index.call(this, item);

    if (selection.contains(item)) { return; }

    if (!this.allowsMultipleSelection()) {  this.clearSelection(); }

    selection.push(item);
    if (idx !== null) { indexes.push(idx); }

    return this;
  });

  this.def('unselectItem', function(item) {
    var selection = this.selection(),
        indexes   = this.selectionIndexes(),
        idx       = index.call(this, item);

    selection.remove(item);
    if (idx !== null) { indexes.remove(idx); }

    return this;
  });

  this.def('clearSelection', function() {
    this.selection().clear();
    this.selectionIndexes().clear();
  });
});
