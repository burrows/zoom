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
    var arranged = this.arranged(), cmp = this.compareFn();
    return cmp ? Z.binsearch(o, arranged, cmp) : arranged.index(o);
  }

  function insert(o) {
    var arranged = this.arranged(),
        cmp      = this.compareFn(),
        filter   = this.filterFn(),
        i;

    if (filter && !filter(o)) { return; }

    if (cmp) {
      i = Z.binsearch(o, arranged, cmp);
      i = i < 0 ? -i - 1 : i;
      arranged.splice(i, 0, o);
    }
    else {
      arranged.push(o);
    }
  }

  function remove(o) {
    var arranged = this.arranged(), idx = index.call(this, o);
    if (idx === null) { return; }
    arranged.splice(idx, 1);
  }

  function rearrange() {
    var content   = this.content(),
        filterFn  = this.filterFn(),
        compareFn = this.compareFn();

    if (!content) { this.arranged(null); return; }

    content = filterFn ? content.select(filterFn) : content.dup();

    if (compareFn) { content.sort$(compareFn); }

    this.arranged(content);
  }

  this.prop('content');
  this.prop('arranged');
  this.prop('compareFn');
  this.prop('filterFn');

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
});
