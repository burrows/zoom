Z.ListView = Z.View.extend(function() {
  function insertItemViews(items, idx) {
    var itemViewType = this.itemViewType(), i, size;

    for (i = 0, size = items.size(); i < size; i++) {
      this.addSubview(itemViewType.create({content: items.at(i)}), idx + i);
    }
  }

  function removeItemViews(idx, n) {
    for (var i = idx + n - 1; i >= idx; i--) {
      this.removeSubview(i).destroy();
    }
  }

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
      case 'replace':
        removeItemViews.call(this, i, size);
        insertItemViews.call(this, content.slice(i, size), i);
        break;
    }
  }

  this.prop('content');

  this.def('initialize', function(props) {
    this.supr(props);
    this.observe('content.@', this, contentObserver, {fire: true});
  });

  this.def('tag', function() { return 'ul'; });

  this.def('itemViewType', function() {
    throw new Error('Z.ListView.itemViewType: this method must be overridden by the sub-type');
  });
});

