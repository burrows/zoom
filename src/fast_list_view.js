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
// to fill the visible area of the view. Then based on the view's node's
// `scrollOffset` property we can determine which content items should currently
// be displayed. The displayed content items are set as the `content` properties
// on the subviews and each subview's `node` property is absolutely positioned
// within the container such that it appears at the appropriate offset.
//
// If you would like to have some views in your list have a height that is
// different than the rest, you can accomplish this by adding their indexes to
// the `customRowHeightIndexes` property and overriding the
// `customRowHeightForIndex` method to return the custom heights. Note that
// there is a performance cost when you have custom heights since the offset
// calculations are no longer a simple multiplication of the item index and
// default row height.
Z.FastListView = Z.ListView.extend(function() {
  var slice = Array.prototype.slice;

  // Internal: The callback function for the `window`'s `resize` event. Resizing
  // the window may change the height of the view so we need to listen for that
  // event and adjust the `height` property if necessary.
  function resizeListener() {
    var node = this.overflowNode();
    if (node.offsetHeight !== this.scrollHeight()) {
      this.scrollHeight(node.offsetHeight);
      this.display();
    }
  }
  
  // Internal: The callback function for the `node`'s `scroll` event. When the
  // view is scrolled we must adjust the `top` property and re-render the
  // subviews.
  function scrollListener() {
    this.scrollOffset(this.overflowNode().scrollTop);
    this.display();
  }

  // Internal: Caches the custom row heights indicated by the
  // `customRowHeightIndexes` property and calculates of row offset adjustments
  // based on those heights.
  function cacheCustomHeightsAndOffsetAdjustments() {
    var _this      = this,
        rowHeight  = this.rowHeight(),
        indexes    = this.customRowHeightIndexes(),
        adjustment = 0;

    if (!indexes || indexes.size() === 0) {
      this.__z_heights__     = null;
      this.__z_adjustments__ = null;
    }
    else {
      this.__z_heights__     = {};
      this.__z_adjustments__ = [];

      indexes.sort().each(function(idx) {
        var height = _this.customRowHeightForIndex(idx);

        _this.__z_heights__[idx] = height;
        _this.__z_adjustments__.push([idx, adjustment]);

        adjustment += (height - rowHeight);
      });

      this.__z_adjustments__.push([Infinity, adjustment]);
    }

    this.needsDisplay(true);
  }

  // Internal: Comparator function for searching the adjustments array.
  function adjustmentCmp(adj, idx) { return Z.cmp(adj[0], idx); }

  // Public: The height of each item view. See the `customRowHeightIndexes`
  // property if any items in your list need to be rendered with a height that
  // is something other than this value.
  this.prop('rowHeight', {def: 30});

  // Public: The number of item views to render over what is necessary to fill
  // the visibile area. The overflow items will be evenly distributed before the
  // first displayed item and after the last displayed item when possible. The
  // overflow views allow scrolling to look smooth.
  this.prop('overflow', {def: 10});

  // Internal: The height of the scrollable container. This property is managed
  // by the view itself and should not be set by client code.
  this.prop('scrollHeight', {def: 0});

  // Internal: The current scroll offset. This property is managed by the view
  // itself and should not be set by client code. You can programtically adjust
  // the scroll position however with the `scrollTo` method.
  this.prop('scrollOffset', {def: 0});

  // Public: This property can be used to tell the list view which content items
  // need to be rendered with a height that is different from the `rowHeight`
  // property. Either set it to a `Z.Array` of indexes or simply push indexes on
  // to the default empty array.
  //
  // When using this property you must also implement the
  // `customRowHeightForIndex` method in your sub-type.
  this.prop('customRowHeightIndexes', {
    get: function() {
      return this.__customRowHeightIndexes__ =
        this.__customRowHeightIndexes__ || Z.A();
    },
    set: function(a) { return this.__customRowHeightIndexes__ = a; }
  });

  // Internal: The `Z.FastListView` constructor.
  this.def('init', function(props) {
    this.supr(props);
    this.observe('customRowHeightIndexes.@', this,
      cacheCustomHeightsAndOffsetAdjustments, {fire: true});
  });

  // Internal: The `Z.FastListView` destructor.
  this.def('destroy', function() {
    var node = this.overflowNode();

    this.stopObserving('customRowHeightIndexes.@', this,
      cacheCustomHeightsAndOffsetAdjustments);
    window.removeEventListener('resize', this.__resizeListener__, false);
    node.removeEventListener('scroll', this.__scrollListener__, false);

    this.supr();
  });

  // Internal: Returns a list of property paths that trigger this view to update
  // itself.
  this.def('displayPaths', function() {
    return this.supr().concat('rowHeight', 'overflow', 'scrollHeight', 'scrollOffset');
  });

  // Internal: Renders the view by creating the container div and then invoking
  // the `update` method to setup the subviews.
  //
  // Returns nothing.
  this.def('render', function() {
    this.node.innerHTML = '<div style="position: relative;"></div>';
    this.update();
  });

  // Internal: Updates the view by syncing the `subviews` array to the list of
  // content items indicated by the `displayRange` method and sets the
  // appropriate offsets and heights.
  //
  // Returns nothing.
  this.def('update', function() {
    var content  = this.content(),
        itemView = this.itemViewType(),
        soffset  = this.scrollOffset(),
        subviews = this.subviews(),
        onode    = this.overflowNode(),
        cnode    = this.contentNode(),
        range    = this.displayRange(),
        n        = range ? range[1] - range[0] + 1 : 0,
        i, item, items, subview, offset, height;
    
    // ensure that the container is tall enough for all content items
    cnode.style.height = this.totalHeight() + 'px';

    // sync the scroll position with the `top` property
    if (onode.scrollTop !== soffset) { onode.scrollTop = soffset; }
    
    // sync the content items we want to display with their appropriate subviews
    if (n > 0) {
      for (i = range[0]; i <= range[1]; i++) {
        item    = content.at(i);
        subview = subviews.at(i % n) ||
          this.addSubview(this.createItemView(itemView, item));
    
        if (subview.content() !== item) { subview.content(item); }
    
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
      }
    }
    
    if (subviews.size() > n) {
      subviews.slice(n).each(function(v) { v.remove().destroy(); });
    }

    this.supr();
  });

  // Internal: The height of the view may not be known until its actually
  // attached to the page, so we override this method in order to first set the
  // view's `height` and `top` properties and trigger a display.
  this.def('didAttachNode', function() {
    var node = this.overflowNode();
  
    this.__z_resizeListener__ = Z.bind(resizeListener, this);
    this.__z_scrollListener__ = Z.bind(scrollListener, this);
  
    window.addEventListener('resize', this.__z_resizeListener__, false);
    node.addEventListener('scroll', this.__z_scrollListener__, false);
  
    this.scrollHeight(node.offsetHeight);
    this.scrollOffset(node.scrollTop);
    this.display();
  });

  // Internal: Overridden to simply mark the view as being dirty.
  this.def('contentItemsInserted', function() { this.needsDisplay(true); });

  // Internal: Overridden to simply mark the view as being dirty.
  this.def('contentItemsRemoved', function() { this.needsDisplay(true); });

  // Public: Returns the node that has its `overflow-y` property set. By default
  // this is the view's `node` property, but you may want to override this if
  // you would rather use a node higher the in hierarchy as the scrollable
  // window.
  this.def('overflowNode', function() { return this.node; });

  // Public: Returns the node that contains all of the item view nodes. This is
  // the node whose height will be set to accomodate all items in the content
  // array. By default this returns the node created by the default
  // implementation of the `render` method but you may want to override if you'd
  // prefer to use a superview's node as the `overflowNode` and this view's
  // `node` as the `contentNode`.
  this.def('contentNode', function() { return this.node.childNodes[0]; });

  // Internal: Tells the view system to use the `contentNode` node to attach
  // subviews to instead of `node`.
  this.def('subviewContainerNode', function() { return this.contentNode(); });

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

  // Public: Notifies the view that a row with a custom height has changed its
  // height. This will trigger an `update` call to adjust positioning to
  // accomodate the new height.
  //
  // *indexes - Zero or more indexes that have had their height change.
  //
  // Returns the receiver.
  this.def('customRowHeightDidChange', function() {
    // FIXME: take given indexes into account
    cacheCustomHeightsAndOffsetAdjustments.call(this);
    return this;
  });

  // Internal: Returns the height that should be applied to the item view at the
  // given index.
  //
  // i - The content item index to return the height for.
  //
  // Returns an integer.
  this.def('rowHeightForIndex', function(i) {
    var heights = this.__z_heights__;
    return heights && heights.hasOwnProperty(i) ? heights[i] : this.rowHeight();
  });
  
  // Internal: Returns the offset that should be applied to the item view at the
  // given index.
  //
  // idx - The content item index to return the offset for.
  //
  // Returns an integer.
  this.def('rowOffsetForIndex', function(idx) {
    var rowHeight   = this.rowHeight(),
        adjustments = this.__z_adjustments__,
        offset      = rowHeight * idx,
        ai;

    if (adjustments) {
      ai = Z.binsearch(idx, adjustments, adjustmentCmp);
      ai = ai < 0 ? -ai - 1 : ai;
      if (!adjustments[ai]) {
        Z.log(idx, ai, adjustments);
      }
      offset += adjustments[ai][1];
    }

    return offset;
  });

  // Internal: Calculates the total height needed to display all rows.
  //
  // Returns an integer.
  this.def('totalHeight', function() {
    var height      = this.rowHeight() * (this.get('content.size') || 0),
        adjustments = this.__z_adjustments__;

    if (adjustments) {
      height += adjustments[adjustments.length - 1][1];
    }

    return height;
  });

  // Internal: Returns a two element native array containing an inclusive range
  // of the item views that should currently be displayed. The range will
  // contain enough views to fill the visible display plus the number of
  // overflow views evenly distributed between the top and bottom where
  // possible.
  this.def('displayRange', function() {
    var size      = this.get('content.size'),
        hasCustom = this.__z_heights__ !== null,
        theight   = this.totalHeight(),
        sheight   = this.scrollHeight(),
        soffset   = this.scrollOffset(),
        rheight   = this.rowHeight(),
        overflow  = this.overflow(),
        nviews    = Math.min(Math.ceil(sheight / rheight), size),
        first, last, ofirst, olast;
  
    if (size === 0 || nviews === 0) { return null; }
  
    first = Math.min(Math.floor(soffset / rheight), size - 1);
    last  = Math.min(first + nviews - 1, size - 1);
  
    // if we have custom row heights we may need to adjust the first and last
    // views to display to ensure that we're inside the visible area and we
    // have enough views to fill the visible area
    if (hasCustom) {
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
  });

  // Public: Returns the subview that is currently displaying the content item
  // at the given index.
  //
  // i - An index in the content array.
  //
  // Returns a subview or `null` if the subview can't be found.
  this.def('subviewForContentIndex', function(i) {
    return this.subviews().find(function(v) {
      return v.__z_contentIndex__ === i;
    });
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

  // Public: Returns the content index that the given subview is currently
  // displaying.
  //
  // v - A subview.
  //
  // Returns an integer or `null` if `v` is not a subview.
  this.def('indexForSubview', function(v) {
    return v.hasOwnProperty('__z_contentIndex__') ? v.__z_contentIndex__ : null;
  });

  // Public: Returns the index of the first content item that is at least
  // partially visible.
  this.def('firstVisibleIndex', function() {
    var soffset = this.scrollOffset(), range = this.displayRange(), i;
  
    if (!range) { return null; }
  
    for (i = range[0]; i <= range[1]; i++) {
      if (this.rowOffsetForIndex(i) + this.rowHeightForIndex(i) > soffset) {
        return i;
      }
    }
  
    return null;
  });
  
  // Public: Returns the first subview that is at least partially visible.
  this.def('firstVisibleSubview', function() {
    var idx = this.firstVisibleIndex();
    return idx === null ? null : this.subviewForContentIndex(idx);
  });
});

