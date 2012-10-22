Z.FastListView = Z.View.extend(function() {
  function resizeListener() { this.height(this.node.offsetHeight); this.display(); }
  function scrollListener() { this.top(this.node.scrollTop); this.display(); }

  this.prop('content');
  this.prop('height', {def: 0});
  this.prop('top', {def: 0});
  this.prop('rowHeight', {def: 30});
  this.prop('overflow', {def: 10});

  this.def('displayPaths', function() {
    return this.supr().concat('content.@', 'height', 'top', 'rowHeight', 'overflow');
  });

  this.def('init', function(props) {
    this.supr(props);
    this.__resizeListener__ = Z.bind(resizeListener, this);
    this.__scrollListener__ = Z.bind(scrollListener, this);

    window.addEventListener('resize', this.__resizeListener__, false);
    this.node.addEventListener('scroll', this.__scrollListener__, false);
  });

  this.def('destroy', function() {
    window.removeEventListener('resize', this.__resizeListener__, false);
    this.node.removeEventListener('scroll', this.__scrollListener__, false);
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
        height    = this.height(),
        rowHeight = this.rowHeight(),
        top       = this.top(),
        overflow  = this.overflow(),
        desired   = Math.min(Math.floor(height / rowHeight + overflow), nitems),
        subviews  = this.subviews(),
        first, i, len, subview, items, item;

    // ensure that the container is tall enough for all content items
    this.node.childNodes[0].style.height = (nitems * rowHeight) + 'px';

    // sync the scroll position with the `top` property
    if (this.node.scrollTop !== top) { this.node.scrollTop = top; }

    // determine which content items to render
    first = Math.max(Math.floor(top / rowHeight) - (overflow / 2), 0);
    items = (content.slice(first, desired) || Z.A()).toNative();

    // sync the content items we want to display with their appropriate subviews
    for (i = 0, len = items.length; i < len; i++) {
      subview = subviews.at((i + first) % desired) ||
        this.addSubview(this.createItemView(items[i]));
      if (subview.content() !== items[i]) { subview.content(items[i]); }
      subview.displayIfNeeded();

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
    this.height(this.node.offsetHeight);
    this.top(this.node.scrollTop);
    this.display();
  });

  this.def('scrollTo', function(item) {
    var i = Z.isNumber(item) ? item : (this.content().index(item) || 0);
    this.top(this.rowHeight() * i);
  });
});

