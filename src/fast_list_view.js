// Public: `Z.FastListView` provides a vertical list view that utilizes virtual
// scrolling in order to handle many content items efficiently. The `Z.ListView`
// type simply syncs all of its content items to its `subviews` array. This
// works fine as long as you don't have too many items to display, but starts to
// cause performance issues when you have a lot of items. `Z.FastListView` can
// handle many more items because it only creates subviews for the content items
// that are currently visible. It can do this because it imposes the restriction
// that the view must have a defined height and each item view must have the
// same height.
//
// The virtual scrolling technique works by creating a container div with an
// explicit height set to the `rowHeight` property times the number of content
// items. This div is placed inside the fast list view's `node`, which must have
// its `overflow-y` css property set to `scroll` or `auto`. This gives us a
// scrollable div that is large enough to contain all of our items. Instead of
// creating subviews for each content item though, we instead only create enough
// to fill the visible area of our view. Then based on the view's node's
// `scrollTop` property we can determine which content items should should
// currently be displayed. The displayed content items are set as the `content`
// properties on the subviews and each subview's `node` property is absolutely
// positioned within the container such that it appears at the appropriate
// offset.
Z.FastListView = Z.View.extend(function() {
  // Internal: The callback function for the `window`'s `resize` event. Resizing
  // the window may change the height of the view so we need to listen for that
  // event and adjust the `height` property if necessary.
  function resizeListener() {
    if (this.node.offsetHeight !== this.scrollHeight()) {
      this.scrollHeight(this.node.offsetHeight);
      this.display();
    }
  }

  // Internal: The callback function for the `node`'s `scroll` event. When the
  // view is scrolled we must adjust the `top` property and re-render the
  // subviews.
  function scrollListener() {
    this.scrollOffset(this.node.scrollTop);
    this.display();
  }

  // Internal: Observes changes to the `itemViewType` property and replaces all
  // existing subviews with instances of the new item view type.
  function itemViewTypeDidChange() {
    var self = this;
    this.subviews().each(function(sv) {
      self.replaceSubview(sv, self.createItemView(sv.content()));
    });
  }

  // Public: A property pointing to a `Z.Array` of objects for the list view to
  // display.
  this.prop('content');

  // Internal: The height of the scrollable container. This property is managed
  // by the view itself and should not be set by client code.
  this.prop('scrollHeight', {def: 0});

  this.prop('totalHeight', {
    dependsOn: ['content.size', 'rowHeight', 'offsetAdjustments'],
    readonly: true,
    cache: true,
    get: function() {
      var size        = this.get('content.size'),
          rowHeight   = this.rowHeight(),
          adjustments = this.offsetAdjustments(),
          height      = size * rowHeight;

      if (!adjustments) { return height; }

      return height + adjustments[adjustments.length - 1][2];
    }
  });

  // Internal: The current scroll offset. This property is managed by the view
  // itself and should not be set by client code. You can programtically adjust
  // the scroll position however with the `scrollTo` method.
  this.prop('scrollOffset', {def: 0});

  // Public: The height of each item view. See the `customRowHeightIndexes`
  // property if any items in your list need to be rendered with a height that
  // is something other than this value.
  this.prop('rowHeight', {def: 30});

  // Public: The number of overflow pixels to render above and below the scroll
  // window. The list view will attempt to render enough additional item views
  // in order to ensure that there are at least this many pixels rendered both
  // above an below the scrollable area.
  this.prop('overflow', {def: 60});

  this.prop('customRowHeightIndexes', {
    cache: true, get: function() { return Z.A(); }
  });

  this.prop('customRowHeights', {
    readonly: true,
    cache: true,
    dependsOn: ['customRowHeightIndexes.@'],
    get: function() {
      var indexes = this.customRowHeightIndexes(), self = this;

      if (!indexes || indexes.size() === 0) { return null; }

      return indexes.inject({}, function(acc, i) {
        acc[i] = self.customRowHeightFor(i);
        return acc;
      });
    }
  });

  this.prop('offsetAdjustments', {
    readonly: true,
    cache: true,
    dependsOn: ['content.size', 'customRowHeightIndexes.@', 'rowHeight'],
    get: function() {
      var size        = this.get('content.size'),
          indexes     = this.customRowHeightIndexes().sort().toNative(),
          rowHeight   = this.rowHeight(),
          adjustments, i, len;

      if (!indexes || indexes.length === 0) { return null; }

      adjustments = [[0, indexes[0], 0]];

      for (i = 1, len = indexes.length; i <= len; i++) {
        adjustments.push([
          indexes[i - 1] + 1,
          indexes[i] || size - 1,
          adjustments[i - 1][2] + this.rowHeightFor(indexes[i - 1]) - rowHeight
        ]);
      }

      return adjustments;
    }
  });

  this.prop('displayRange', {
    readonly: true,
    cache: true,
    dependsOn: [
      'content.size', 'totalHeight', 'scrollHeight', 'scrollOffset',
      'rowHeight', 'overflow', 'customRowHeights'
    ],
    get: function() {
      var n        = this.get('content.size'),
          custom   = this.customRowHeights(),
          theight  = this.totalHeight(),
          sheight  = this.scrollHeight(),
          soffset  = this.scrollOffset(),
          rheight  = this.rowHeight(),
          overflow = this.overflow(),
          dheight  = sheight + overflow * 2,
          nviews   = Math.min(Math.ceil(dheight / rheight), n),
          top, bottom, first, last;

      if (n === 0) { return null; }

      top    = Math.max(soffset - overflow, 0);
      bottom = Math.min(top + dheight - 1, theight);
      top    = Math.max(0, bottom - dheight + 1);
      first  = Math.min(Math.floor(top / rheight), n - 1);

      // custom row heights that are less than the default may cause us to
      // overshoot the first item to display, so we backtrack here if necessary
      if (custom) { while (this.rowOffsetFor(first) > top) { first--; } }

      last = Math.max(Math.min(first + nviews - 1, n - 1), 0);

      if (custom) {
        // again, custom heights that are less than the default may mean that
        // our guess at the number of views will not be enough to fill our
        // desired display area, so we add views on here until we're sure we
        // have enough to cover the display area
        while (last < n - 1 && (this.rowOffsetFor(last) + this.rowHeightFor(last)) < bottom) { last++; }
      }
      else {
        // ensure that we're always displaying the same number of views, even
        // when we hit the end of the list
        first = Math.max(0, last - nviews + 1);
      }

      return [first, last];
    }
  });

  // Public: The `Z.View` subtype to use for content item views. This must be
  // specified in sub-types and must have a `content` property.
  this.prop('itemViewType');

  // Internal: Returns a list of property paths that trigger this view to update
  // itself.
  this.def('displayPaths', function() {
    return this.supr().concat('displayRange');
  });

  // Internal: The `Z.FastListView` constructor. This is overridden in order to
  // setup the `resize` and `scroll` event listeners.
  this.def('init', function(props) {
    this.supr(props);
    this.__resizeListener__ = Z.bind(resizeListener, this);
    this.__scrollListener__ = Z.bind(scrollListener, this);

    window.addEventListener('resize', this.__resizeListener__, false);
    this.node.addEventListener('scroll', this.__scrollListener__, false);
    this.observe('itemViewType', this, itemViewTypeDidChange);
  });

  // Internal: The `Z.FastListView` destructor. This is overridden in order to
  // remove the event listeners setup in `init`.
  this.def('destroy', function() {
    window.removeEventListener('resize', this.__resizeListener__, false);
    this.node.removeEventListener('scroll', this.__scrollListener__, false);
    this.stopObserving('itemViewType', this, itemViewTypeDidChange);
    return this.supr();
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
      throw new Error(Z.fmt("Z.FastListView.createItemView: `itemViewType` is not defined: %@", this));
    }

    return type.create({content: content});
  });

  // Internal: Renders the view by creating the container div and then invoking
  // the `update` method to setup the subviews.
  //
  // Returns nothing.
  this.def('render', function() {
    this.node.innerHTML = '<div style="position: relative;"></div>';
    this.update();
  });

  // Internal: Updates the view by syncing the `subviews` area to the list of
  // content items that should be displayed based on the views current `height`,
  // `rowHeight`, `top`, and `overflow` properties.
  //
  // Returns nothing.
  this.def('update', function() {
    var content  = this.content(),
        soffset  = this.scrollOffset(),
        rheight  = this.rowHeight(),
        theight  = this.totalHeight(),
        subviews = this.subviews(),
        range    = this.displayRange(),
        n        = range ? range[1] - range[0] + 1 : 0,
        i, item, subview, items, display;

    // ensure that the container is tall enough for all content items
    this.node.childNodes[0].style.height = theight + 'px';

    // sync the scroll position with the `top` property
    if (this.node.scrollTop !== soffset) { this.node.scrollTop = soffset; }

    // sync the content items we want to display with their appropriate subviews
    if (n > 0) {
      for (i = range[0]; i <= range[1]; i++) {
        item    = content.at(i);
        display = false;
        subview = subviews.at(i % n);

        if (!subview) {
          subview = this.addSubview(this.createItemView(item));
          display = true;
        }

        if (subview.content() !== item) {
          subview.content(item);
          display = true;
        }

        subview.node.style.position = 'absolute';
        subview.node.style.top      = this.rowOffsetFor(i) + 'px';
        subview.node.style.height   = this.rowHeightFor(i) + 'px';
        subview.node.style.left     = 0;
        subview.node.style.right    = 0;

        if (display) { subview.display(); }
      }
    }

    if (subviews.size() > n) { subviews.slice(n).each('remove'); }
  });

  this.def('customRowHeightFor', function(i) {
    throw new Error("Z.FastListView.customRowHeightFor: must be overridden in sub-types when customRowHeightIndexes is used");
  });

  this.def('rowHeightFor', function(i) {
    var custom = this.customRowHeights();
    return custom && custom.hasOwnProperty(i) ? custom[i] : this.rowHeight();
  });

  this.def('rowOffsetFor', function(idx) {
    var adjustments = this.offsetAdjustments(),
        offset      = this.rowHeight() * idx,
        i, len;

    if (!adjustments) { return offset; }

    for (i = 0, len = adjustments.length; i < len; i++) {
      if (adjustments[i][0] <= idx && idx <= adjustments[i][1]) {
        return offset + adjustments[i][2];
      }
    }

    throw new Error("Z.FastListView.rowOffsetFor: BUG: " + idx);
  });

  // Internal: Tells the view system to use the container node to attach
  // subviews instead of `node`.
  this.def('subviewContainerNode', function() {
    return this.node.childNodes[0];
  });

  // Internal: The height of the view may not be known until its actually
  // attached to the page, so we override this method in order to first set the
  // view's `height` and `top` properties and trigger a display.
  this.def('didAttachNode', function() {
    this.scrollHeight(this.node.offsetHeight);
    this.scrollOffset(this.node.scrollTop);
    this.display();
  });

  // Public: Cause the view to scroll to a particular content item.
  //
  // item - Either a content item or the index of a content item.
  //
  // Returns the receiver.
  this.def('scrollTo', function(item) {
    var i = Z.isNumber(item) ? item : (this.content().index(item) || 0);
    this.scrollOffset(this.rowOffsetFor(i));
    return this;
  });
});

