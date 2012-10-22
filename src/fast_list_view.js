Z.FastListView = Z.View.extend(function() {
  this.prop('content');
  this.prop('rowHeight', {def: 30});
  this.prop('overflow', {def: 10});

  this.def('displayPaths', function() {
    return this.supr().concat('content.@', 'rowHeight', 'overflow');
  });

  this.def('init', function(props) {
    this.supr(props);
    this.__display__ = Z.bind(this.display, this);
    window.addEventListener('resize', this.__display__, false);
    this.node.addEventListener('scroll', this.__display__, false);
  });

  this.def('destroy', function() {
    window.removeEventListener('resize', this.__display__, false);
    this.node.removeEventListener('scroll', this.__display__, false);
    return this.supr();
  });

  this.def('itemViewType', function() {
    throw new Error('Z.FastListView.itemViewType: this method must be overridden by the sub-type');
  });
  
  this.def('createItemView', function(content) {
    return this.itemViewType().create({content: content});
  });

  this.def('render', function() {
    this.node.innerHTML = '<div style="position: relative;"></div>';
    this.update();
  });

  this.def('update', function() {
    var content   = this.content(),
        nitems    = content.size(),
        height    = this.node.offsetHeight,
        rowHeight = this.get('rowHeight'),
        top       = this.node.scrollTop,
        overflow  = this.overflow(),
        desired   = Math.min(Math.floor(height / rowHeight + overflow), nitems),
        subviews  = this.subviews(),
        first, i, len, subview, items, item;

    this.node.childNodes[0].style.height   = (nitems * rowHeight) + 'px';
    this.node.childNodes[0].style.position = 'relative';

    first = Math.max(Math.floor(top / rowHeight) - (overflow / 2), 0);
    items = (content.slice(first, desired) || Z.A()).toNative();

    for (i = 0, len = items.length; i < len; i++) {
      item    = items[i];
      subview = subviews.at((i + first) % desired);

      if (!subview) {
        subview = this.addSubview(this.createItemView(item));
        subview.display();
      }

      if (subview.content() !== item) {
        subview.content(item);
        subview.display();
      }

      subview.node.style.display  = 'block';
      subview.node.style.position = 'absolute';
      subview.node.style.top      = (rowHeight * (i + first)) + 'px';
      subview.node.style.height   = rowHeight;
      subview.node.style.left     = 0;
      subview.node.style.right    = 0;
    }

    if (subviews.size() > items.length) {
      subviews.slice(items.length).invoke('remove');
    }
  });

  this.def('subviewContainerNode', function() {
    return this.node.childNodes[0];
  });

  this.def('didAttachNode', function() {
    this.display();
  });
});

