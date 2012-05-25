Z.ListView = Z.View.extend(function() {
  function insertItemViews(items, idx) {
    var itemViewType = this.itemViewType(), i, size;

    for (i = 0, size = items.size(); i < size; i++) {
      this.addSubview(itemViewType.create({content: items.at(i)}), idx + i);
    }
  }

  function removeItemViews(idx, n) {
    for (var i = idx + n - 1; i >= idx; i--) { this.removeSubview(i); }
  }

  function replaceItemViews(items, idx) {
    removeItemViews(idx, items.size());
    insertItemViews(items, idx);
  }

  function contentObserver(n) {
    var content = this.content(), i = n.range[0], size = n.range[1];

    switch (n.type) {
      case 'insert'  : insertItemViews(content.slice(i, size), i); break;
      case 'remove'  : removeItemViews(i, size); break;
      case 'replace' : replaceItemViews(content.slice(i, size), i); break;
    }
  }

  this.prop('content');

  this.def('initialize', function(props) {
    var content;
    this.supr(props);
    this.observe('content.@', this, contentObserver);
    if (content = this.content()) { insertItemViews.call(this, content, 0); }
  });

  this.def('tag', function() { return 'ul'; });

  this.def('itemViewType', function() {
    throw new Error('Z.ListView.itemViewType: this method must be overridden by the sub-type');
  });
});

