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
    var node = this.overflowNode();
    this.scrollOffset(node.scrollTop);
    this.display();
  }

  // Internal: Calculates and caches each custom row's height and each row's
  // offset from the top of the list.
  //
  // start - An index into the content array marking where to start updating
  //         heights and offsets.
  //
  // Returns nothing.
  function cacheHeightsAndOffsets(start) {
    var size    = this.get('content.size') || 0,
        rheight = this.rowHeight(),
        indexes = this.customRowHeightIndexes().sort().toNative(),
        custom  = indexes.shift(),
        offset  = 0,
        i, n;

    start = typeof start === 'undefined' ? 0 : start;

    this.__z_offsets__ = this.__z_offsets__ || new Array(size);
    this.__z_heights__ = this.__z_heights__ || {};

    for (i = start; i < size; i++) {
      this.__z_offsets__[i] = offset;

      if (i === custom) {
        this.__z_heights__[i] = this.customRowHeightForIndex(i);

        offset = offset + this.__z_heights__[i];
        custom = indexes.shift();
      }
      else {
        offset = offset + rheight;
      }
    }
  }

  // Internal: Recalculates custom heights and offsets if there are currently
  // rows with custom heights and clears the caches if there are none.
  function customRowHeightIndexesObserver() {
    var indexes = this.customRowHeightIndexes();

    if (indexes && indexes.size() > 0) {
      cacheHeightsAndOffsets.call(this);
    }
    else {
      Z.del(this, '__z_heights__');
      Z.del(this, '__z_offsets__');
    }

    this.needsDisplay(true);
  }

  // Public: Override the default `Z.ListView` tag of `ul` since by default
  // `Z.FastListView` renders a wrapper `div` around the item views.
  this.tag = 'div';

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

  // Public: Boolean property indicating whether or not the view currently has
  // rows with custom heights.
  this.prop('hasCustomRowHeights', {
    readonly: true, cache: true, dependsOn: ['customRowHeightIndexes.size'],
    get: function() { return this.get('customRowHeightIndexes.size') > 0; }
  });

  // Internal: The `Z.FastListView` constructor.
  this.def('init', function(props) {
    this.supr(props);

    this.observe('customRowHeightIndexes.@', this,
      customRowHeightIndexesObserver);

    if (this.get('customRowHeightIndexes.size') > 0) {
      cacheHeightsAndOffsets.call(this);
    }
  });

  // Internal: The `Z.FastListView` destructor.
  this.def('destroy', function() {
    this.stopObserving('customRowHeightIndexes.@', this,
      customRowHeightIndexesObserver);

    if (this.__z_resizeListener__) {
      window.removeEventListener('resize', this.__z_resizeListener__, false);
      this.__z_resizeListener__ = null;
    }

    if (this.__z_scrollListener__) {
      this.overflowNode().removeEventListener('scroll',
        this.__z_scrollListener__, false);
      this.__z_scrollListener__ = null;
    }

    this.supr();
  });

  // Internal: Returns a list of property paths that trigger this view to update
  // itself.
  this.def('displayPaths', function() {
    return this.supr().concat('rowHeight', 'overflow', 'scrollHeight', 'scrollOffset');
  });

  // Internal: Renders the view by creating the `ul` and then invoking the
  // `update` method to setup the subviews.
  //
  // Returns nothing.
  this.def('render', function() {
    this.node.innerHTML = '<ul style="position: relative;"></ul>';
    this.update();
  });

  // Internal: Updates the view by syncing the `subviews` array to the list of
  // content items indicated by the `displayRange` method and sets the
  // appropriate offsets and heights.
  //
  // Returns nothing.
  this.def('update', function() {
    var content  = this.content(),
        soffset  = this.scrollOffset(),
        subviews = this.subviews(),
        onode    = this.overflowNode(),
        cnode    = this.subviewContainerNode(),
        range    = this.displayRange(),
        n        = range ? range[1] - range[0] + 1 : 0,
        repos    = [],
        i, item, items, subview, offset, height, moved;

    if (this.showingEmpty()) {
      cnode.style.height = null;
      return;
    }

    // ensure that the container is tall enough for all content items
    cnode.style.height = this.totalHeight() + 'px';

    // sync the scroll position with the `top` property
    if (onode.scrollTop !== soffset) { onode.scrollTop = soffset; }

    (this.__z_subview2index__ = this.__subview2index__ || Z.H()).clear();
    
    // sync the content items we want to display with their appropriate subviews
    if (n > 0) {
      for (i = range[0]; i <= range[1]; i++) {
        item    = content.at(i);
        offset  = this.rowOffsetForIndex(i);
        height  = this.rowHeightForIndex(i);
        moved   = false;
        subview = subviews.at(i % n);

        if (!subview) {
          moved   = true;
          subview = this.addSubview(this.createItemView(item));
        }

        this.__z_subview2index__.at(subview, i);
    
        if (subview.content() !== item) {
          moved = true;
          subview.content(item);
        }

        if (moved) {
          subview.node.style.position = 'absolute';
          subview.node.style.left     = 0;
          subview.node.style.right    = 0;
          subview.node.style.top      = offset + 'px';
          subview.node.style.height   = height + 'px' ;
        }
        else if (subview.node.style.top !== offset + 'px' ||
                 subview.node.style.height !== height + 'px') {
          repos.push([subview, offset, height]);
        }
      }
    }

    if (subviews.size() > n) {
      subviews.slice(n).each(function(v) { v.remove().destroy(); });
    }

    if (repos.length > 0) { this.repositionSubviews(repos); }

    this.supr();
  });

  // Internal: The height of the view may not be known until its actually
  // attached to the page, so we override this method in order to first set the
  // view's `height` and `top` properties and trigger a display.
  this.def('didAttachNode', function() {
    var node = this.overflowNode();
  
    this.__z_resizeListener__ = Z.bind(resizeListener, this);
    window.addEventListener('resize', this.__z_resizeListener__, false);
  
    this.resumeScrollListener();
    this.scrollHeight(node.offsetHeight);
    this.scrollOffset(node.scrollTop);
    this.display();
  });

  // Public: Starts or resumes the internal scroll event listener. This method
  // should only ever be called if the `pauseScrollListener` was previously
  // called.
  //
  // Returns the receiver.
  this.def('resumeScrollListener', function() {
    var node = this.overflowNode();

    if (node && !this.__z_scrollListener__) {
      this.__z_scrollListener__ = Z.bind(scrollListener, this);
      node.addEventListener('scroll', this.__z_scrollListener__, false);
      this.scrollOffset(node.scrollTop);
    }

    return this;
  });

  // Public: Causes `scroll` events on the view's `overflowNode` to be ignored
  // until the listener is resumed. This method may be useful to prevent updates
  // from happening while a custom row height animation is in progress.
  //
  // Returns the receiver.
  this.def('pauseScrollListener', function() {
    var node = this.overflowNode();

    if (node && this.__z_scrollListener__) {
      node.removeEventListener('scroll', this.__z_scrollListener__, false);
      this.__z_scrollListener__ = null;
    }

    return this;
  });

  // Internal: Overridden to simply mark the view as being dirty.
  this.def('contentItemsAdded', function() { this.needsDisplay(true); });

  // Internal: Overridden to simply mark the view as being dirty.
  this.def('contentItemsRemoved', function() { this.needsDisplay(true); });

  // Internal: Tells the view system to use the rendered `ul` node to attach
  // subviews to instead of `node`.
  this.def('subviewContainerNode', function() {
    return this.node.childNodes[0];
  });

  // Public: Returns the node that has its `overflow-y` property set to `scroll`
  // or `auto`. By default this is the view's `node` property, but you may want
  // to override this if you must use something other than the view's `node`.
  this.def('overflowNode', function() { return this.node; });

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
    var indexes = slice.call(arguments).sort();
    cacheHeightsAndOffsets.call(this, indexes[0]);
    this.needsDisplay(true);
    return this;
  });

  // Internal: Returns the height that should be applied to the item view at the
  // given index.
  //
  // i - The content item index to return the height for.
  //
  // Returns an integer.
  this.def('rowHeightForIndex', function(i) {
    return this.hasCustomRowHeights() && this.__z_heights__.hasOwnProperty(i) ?
      this.__z_heights__[i] : this.rowHeight();
  });
  
  // Internal: Returns the offset that should be applied to the item view at the
  // given index.
  //
  // idx - The content item index to return the offset for.
  //
  // Returns an integer.
  this.def('rowOffsetForIndex', function(i) {
    return this.hasCustomRowHeights() ?
      this.__z_offsets__[i] : this.rowHeight() * i;
  });

  // Internal: Calculates the total height needed to display all rows.
  //
  // Returns an integer.
  this.def('totalHeight', function() {
    var size = this.get('content.size') || 0;

    return this.hasCustomRowHeights() ?
      this.__z_offsets__[size - 1] + this.rowHeightForIndex(size - 1) :
      this.rowHeight() * size;
  });

  // Internal: Returns a two element native array containing an inclusive range
  // of the item views that should currently be displayed. The range will
  // contain enough views to fill the visible display plus the number of
  // overflow views evenly distributed between the top and bottom where
  // possible.
  this.def('displayRange', function() {
    var size      = this.get('content.size'),
        hasCustom = this.hasCustomRowHeights(),
        theight   = this.totalHeight(),
        sheight   = this.scrollHeight(),
        soffset   = this.scrollOffset(),
        rheight   = this.rowHeight(),
        overflow  = this.overflow(),
        nviews    = Math.min(Math.ceil(sheight / rheight), size),
        first, last, ofirst, olast;
  
    if (size === 0 || nviews === 0) { return null; }

    first = Math.min(Math.floor(soffset / rheight), size - 1);
  
    // if we have custom row heights we may need to adjust the first and last
    // views to display to ensure that we're inside the visible area and we
    // have enough views to fill the visible area
    if (hasCustom) {
      if (this.rowOffsetForIndex(first) > soffset) {
        while (this.rowOffsetForIndex(first) > soffset) {
          first--;
        }
      }
      else {
        while (this.rowOffsetForIndex(first) + this.rowHeightForIndex(first) < soffset) {
          first++;
        }
      }
    }

    last = Math.min(first + nviews - 1, size - 1);
  
    // add in the overflow views
    ofirst = Math.max(first - Math.floor(overflow / 2), 0);
    olast  = Math.min(last + (overflow - (first - ofirst)), size - 1);
    ofirst = Math.max(0, olast - (nviews + overflow) + 1);
  
    return [ofirst, olast];
  });

  // Public: Called by the `update` method when a view's position needs to
  // change to due a custom row height change. The default implementation simply
  // changes the subview's `node` to have the given offset and height, but you
  // may want to override this method in order to implement an animation.
  //
  // Public: Called by the `update` method when subviews need to have their
  // top offset and/or height adjusted due to a custom row height change. The
  // default implementation simply change the subview's `node` to have the given
  // top offset and height, but you may want to override this method in order to
  // implement an animation.
  //
  // repos - An array of 3-element arrays, each of which contains the subview
  //         to reposition, the new top offset, and the new height.
  //
  // Returns the receiver.
  this.def('repositionSubviews', function(repos) {
    var i, len;

    for (i = 0, len = repos.length; i < len; i++) {
      repos[i][0].node.style.top    = repos[i][1] + 'px';
      repos[i][0].node.style.height = repos[i][2] + 'px';
    }

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

  // Public: Returns the subview that is currently displaying the content item
  // at the given index.
  //
  // i - An index in the content array.
  //
  // Returns a subview or `null` if the subview can't be found.
  this.def('subviewForContentIndex', function(i) {
    var tuple = this.__z_subview2index__.find(function(tuple) {
      return tuple[1] === i;
    });

    return tuple ? tuple[0] : null;
  });

  // Public: Returns the content index that the given subview is currently
  // displaying.
  //
  // v - A subview.
  //
  // Returns an integer or `null` if `v` is not a subview.
  this.def('indexForSubview', function(v) {
    if (!this.__z_subview2index__) { return null; }
    return this.__z_subview2index__.at(v);
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

  // Public: Returns the index of the first content item that is fully scrolled
  // past the scroll offset.
  this.def('firstFullyVisibleIndex', function() {
    var idx     = this.firstVisibleIndex(),
        size    = this.get('content.size'),
        soffset = this.scrollOffset();

    if (idx === null) { return null; }
    if (this.rowOffsetForIndex(idx) < soffset) { idx++; }

    return idx <= (size - 1) ? idx : null;
  });
  
  // Public: Returns the first subview that is at least partially visible.
  this.def('firstVisibleSubview', function() {
    var idx = this.firstVisibleIndex();
    return idx === null ? null : this.subviewForContentIndex(idx);
  });

  // Public: Returns the first subview that is fully scrolled past the scroll
  // offset.
  this.def('firstFullyVisibleSubview', function() {
    var idx = this.firstFullyVisibleIndex();
    return idx === null ? null : this.subviewForContentIndex(idx);
  });

  // Internal: Overridden from the `Z.ListView` implementation to first remove
  // any existing content item views since `Z.FastListView` overrides
  // `contentItemsRemoved` to do nothing.
  this.def('addEmptyView', function() {
    this.subviews().slice().each(function(v) { v.remove().destroy(); });
    return this.supr();
  });
});
