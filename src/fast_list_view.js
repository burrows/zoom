// Public: `Z.FastListView` provides a vertical list view that utilizes virtual
// scrolling in order to handle many content items efficiently. The `Z.ListView`
// type simply syncs all of its content items to its `subviews` array. This
// works fine as long as you don't have too many items to display, but can lead
// to performance issues when you have a lot of items to render.
// `Z.FastListView` can handle many more items because it only creates subviews
// for the content items that are currently visible (plus a few overflow items).
// It can do this because it imposes the restriction that the view must have a
// specified height and all item views must also have a consistent specified
// height.
//
// The virtual scrolling technique works by creating a container div with an
// explicit height set to the `rowHeight` property times the number of content
// items. This div is placed inside the fast list view's `node`, which must have
// its `overflow-y` css property set to `scroll` or `auto`. This gives us a
// scrollable div that is large enough to contain all of our items. Instead of
// creating subviews for each content item though, we instead only create enough
// to fill the visible area of our view. Then based on the view's node's
// `scrollOffset` property we can determine which content items should currently
// be displayed. The displayed content items are set as the `content` properties
// on the subviews and each subview's `node` property is absolutely positioned
// within the container such that it appears at the appropriate offset.
//
// If you would like to have some views in your list have a height that is
// different than the rest, you can accomplish this by adding their indexes to
// the `customRowHeightIndexes` property and overriding the
// `customRowHeightForIndex` method to return their custom heights. Note that
// there is a performance cost when you have custom heights since the offset
// calculations are no longer a simple multiplication of the item index and
// default row height.
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

  // Public: The height of each item view. See the `customRowHeightIndexes`
  // property if any items in your list need to be rendered with a height that
  // is something other than this value.
  this.prop('rowHeight', {def: 30});

  // Public: The number of item views to render over what is necessary to fill
  // the visibile area. The overflow items will be evenly distributed before the
  // first displayed item and after the last displayed item when possible. The
  // overflow views allow scrolling to look smooth.
  this.prop('overflow', {def: 10});

  // Public: This property can be used to tell the list view which content items
  // need to be rendered with a height that is different from the `rowHeight`
  // property. Either set it to a `Z.Array` of indexes or simply push indexes on
  // to the default empty array.
  //
  // When using this property you must also implement the
  // `customRowHeightForIndex` method in your sub-type.
  this.prop('customRowHeightIndexes', {
    cache: true, get: function() { return Z.A(); }
  });

  // Internal: The height of the scrollable container. This property is managed
  // by the view itself and should not be set by client code.
  this.prop('scrollHeight', {def: 0});

  // Internal: The current scroll offset. This property is managed by the view
  // itself and should not be set by client code. You can programtically adjust
  // the scroll position however with the `scrollTo` method.
  this.prop('scrollOffset', {def: 0});

  // Internal: Returns an array of triples, each of which contain an inclusive
  // range and the offset adjustment that needs to be applied to the default
  // offset for items in that range. This property is only used when there are
  // custom row heights.
  this.prop('offsetAdjustments', {
    readonly: true, cache: true,
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
          adjustments[i - 1][2] + this.rowHeightForIndex(indexes[i - 1]) - rowHeight
        ]);
      }

      return adjustments;
    }
  });

  // Internal: The total height necessary to accomodate all items. This value is
  // used to set the height of the scrollable container node. When there are no
  // custom row heights, then this is simply the number of content items times
  // the `rowHeight` property. When there are custom row heights, then the
  // `offsetAdjustments` property is used to determine the total height.
  this.prop('totalHeight', {
    readonly: true, cache: true,
    dependsOn: ['content.size', 'rowHeight', 'offsetAdjustments'],
    get: function() {
      var size        = this.get('content.size'),
          rowHeight   = this.rowHeight(),
          adjustments = this.offsetAdjustments(),
          height      = size * rowHeight;

      if (!adjustments) { return height; }

      return height + adjustments[adjustments.length - 1][2];
    }
  });

  // Internal: Returns a native object that maps the index of each custom row
  // to the return value of `customRowHeightForIndex`.
  this.prop('customRowHeights', {
    readonly: true, cache: true,
    dependsOn: ['customRowHeightIndexes.@'],
    get: function() {
      var indexes = this.customRowHeightIndexes(), self = this;

      if (!indexes || indexes.size() === 0) { return null; }

      return indexes.inject({}, function(acc, i) {
        acc[i] = self.customRowHeightForIndex(i);
        return acc;
      });
    }
  });

  // Internal: Returns a two element native array containing an inclusive range
  // of the item views that should currently be displayed. The range will
  // contain enough views to fill the visible display plus the number of
  // overflow views evenly distributed between the top and bottom where
  // possible.
  this.prop('displayRange', {
    readonly: true, cache: true,
    dependsOn: [
      'content.size', 'totalHeight', 'scrollHeight', 'scrollOffset',
      'rowHeight', 'overflow', 'customRowHeights'
    ],
    get: function() {
      var size     = this.get('content.size'),
          custom   = this.customRowHeights(),
          theight  = this.totalHeight(),
          sheight  = this.scrollHeight(),
          soffset  = this.scrollOffset(),
          rheight  = this.rowHeight(),
          overflow = this.overflow(),
          nviews   = Math.min(Math.ceil(sheight / rheight), size),
          first, last, ofirst, olast;

      if (size === 0) { return null; }

      first = Math.min(Math.floor(soffset / rheight), size - 1);
      last  = Math.min(first + nviews - 1, size - 1);

      // if we have custom row heights we may need to adjust the first and last
      // views to display to ensure that we're inside the visible area and we
      // have enough views to fill the visible area
      if (custom) {
        while (this.rowOffsetForIndex(first) > soffset) { first--; last--; }

        while (last < size - 1 && (this.rowOffsetForIndex(last) +
          this.rowHeightForIndex(last)) < (soffset + sheight)) {
          last++;
        }

        nviews = last - first + 1;
      }

      // add in the overflow views
      ofirst = Math.max(first - Math.floor(overflow / 2), 0);
      olast  = Math.min(last + (overflow - (first - ofirst)), size - 1);
      ofirst = Math.max(0, olast - (nviews + overflow) + 1);

      return [ofirst, olast];
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
  // content items indicated by the `displayRange` property and sets the
  // appropriate offsets and heights.
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
        i, item, subview, items, display, offset, height;

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

        subview.__z_contentIndex__  = i;
        subview.node.style.position = 'absolute';
        subview.node.style.left     = 0;
        subview.node.style.right    = 0;

        offset = this.rowOffsetForIndex(i);
        height = this.rowHeightForIndex(i);

        if (subview.node.style.top !== offset + 'px' ||
            subview.node.style.height !== height + 'px') {
          this.positionSubview(subview, offset, height);
        }

        if (display) { subview.display(); }
      }
    }

    if (subviews.size() > n) { subviews.slice(n).each('remove'); }
  });

  // Public: Positions the given subview's node using the given offset and
  // height values by setting the `top` and `height` css properties. You may
  // want to override this method in order to animate these properties.
  //
  // subview - The `Z.View` to position.
  // offset  - A number indicating the top offset that the view should be
  //           positioned at.
  // height  - The height the view should have.
  //
  // Returns the receiver.
  this.def('positionSubview', function(subview, offset, height) {
    subview.node.style.top    = offset + 'px';
    subview.node.style.height = height + 'px';
    return this;
  });

  // Public: This method must be overridden when indexes are added to the
  // `customRowHeightIndexes` property. It should return the custom height of
  // the view at the given index.
  //
  // i - The content item index to return the custom height for.
  //
  // Returns an integer.
  this.def('customRowHeightForIndex', function(i) {
    throw new Error("Z.FastListView.customRowHeightForIndex: must be overridden in sub-types when customRowHeightIndexes is used");
  });

  // Internal: Returns the height that should be applied to the item view at the
  // given index.
  //
  // i - The content item index to return the height for.
  //
  // Returns an integer.
  this.def('rowHeightForIndex', function(i) {
    var custom = this.customRowHeights();
    return custom && custom.hasOwnProperty(i) ? custom[i] : this.rowHeight();
  });

  // Internal: Returns the offset that should be applied to the item view at the
  // given index.
  //
  // idx - The content item index to return the offset for.
  //
  // Returns an integer.
  this.def('rowOffsetForIndex', function(idx) {
    var adjustments = this.offsetAdjustments(),
        offset      = this.rowHeight() * idx,
        i, len;

    if (!adjustments) { return offset; }

    for (i = 0, len = adjustments.length; i < len; i++) {
      if (adjustments[i][0] <= idx && idx <= adjustments[i][1]) {
        return offset + adjustments[i][2];
      }
    }

    throw new Error("Z.FastListView.rowOffsetForIndex: BUG: " + idx);
  });

  // Public: Returns the subview that is currently displaying the content item
  // at the given index.
  //
  // i - An index in the content array.
  //
  // Returns a subview or `null` if the subview can't be found.
  this.def('subviewForIndex', function(i) {
    return this.subviews().find(function(v) {
      return v.__z_contentIndex__ === i;
    });
  });

  // Public: Returns the content index that the given subview is currently
  // displaying.
  //
  // v - A subview.
  //
  // Returns an integer or `null` if `v` is not a subview.
  this.def('indexForSubview', function(v) {
    return v.hasOwnProperty('__z_contentIndex__') ? v.__z_contentIndex__ : null;
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
    this.scrollOffset(this.rowOffsetForIndex(i));
    return this;
  });
});

