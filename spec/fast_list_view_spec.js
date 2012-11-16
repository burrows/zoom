(function() {

if (!this.Z) { require('./helper'); }

describe('Z.FastListView', function() {
  var items = Z.A(), ItemView, view, i;

  for (i = 0; i < 50; i++) {
    items.push({title: 'title ' + i, desc: 'description ' + i});
  }

  ItemView = Z.View.extend(function() {
    this.prop('content');
    this.def('render', function() {
      this.node.innerHTML = Z.fmt('<span class="title">%@</span><span class="desc">%@</span>',
                                  this.content().title, this.content().desc);
    });
  });

  beforeEach(function() {
    view = Z.FastListView.extend(function() {
      this.itemViewType(ItemView);
    }).create({content: items, scrollHeight: 50, rowHeight: 10, overflow: 4});

    view.display();
  });

  it('should render a subview container div with relative positioning', function() {
    expect(view.node.childNodes[0].style.position).toBe('relative');
  });

  it('should set the height of the container div to be large enough to accomodate each content item', function() {
    expect(view.node.childNodes[0].style.height).toBe('500px');
  });

  describe('.subviewContainerNode', function() {
    it('should return the node with relative positioning', function() {
      expect(view.subviewContainerNode()).toBe(view.node.childNodes[0]);
    });
  });

  describe('.createItemView', function() {
    it('should throw an exception when `itemViewType` is `null`', function() {
      var v = Z.FastListView.create({itemViewType: null, content: Z.A({})});

      expect(function() {
        v.createItemView({});
      }).toThrow(Z.fmt("Z.FastListView.createItemView: `itemViewType` is not defined: %@", v));
    });
  });

  describe('changing `itemViewType` property', function() {
    it('should replace all current subviews with instances of the new item view type', function() {
      var ivt = Z.View.extend(function() { this.prop('content'); });

      expect(view.get('subviews.size')).toBe(9);
      expect(view.get('subviews.type').uniq()).toEq(Z.A(ItemView));
      view.itemViewType(ivt);
      expect(view.get('subviews.size')).toBe(9);
      expect(view.get('subviews.type').uniq()).toEq(Z.A(ivt));
    });
  });

  describe('with no custom row heights', function() {
    describe('.customRowHeights', function() {
      it('should return null', function() {
        expect(view.customRowHeights()).toBe(null);
      });
    });

    describe('.offsetAdjustments', function() {
      it('should return null', function() {
        expect(view.offsetAdjustments()).toBe(null);
      });
    });

    describe('.displayRange', function() {
      it('should return the first and list index of the items to render based on the current scrollOffset, rowHeight, and overflow properties', function() {
        expect(view.displayRange()).toEq([0, 8]);
      });

      it('should update when the scrollOffset property changes', function() {
        view.scrollOffset(10);
        expect(view.displayRange()).toEq([0, 8]);
        view.scrollOffset(20);
        expect(view.displayRange()).toEq([0, 8]);
        view.scrollOffset(30);
        expect(view.displayRange()).toEq([1, 9]);
        view.scrollOffset(40);
        expect(view.displayRange()).toEq([2, 10]);
        view.scrollOffset(45);
        expect(view.displayRange()).toEq([2, 10]);
        view.scrollOffset(49);
        expect(view.displayRange()).toEq([2, 10]);
        view.scrollOffset(50);
        expect(view.displayRange()).toEq([3, 11]);
        view.scrollOffset(450);
        expect(view.displayRange()).toEq([41, 49]);
      });

      it('should update when the rowHeight property changes', function() {
        expect(view.displayRange()).toEq([0, 8]);
        view.rowHeight(20);
        expect(view.displayRange()).toEq([0, 6]);
        view.rowHeight(5);
        expect(view.displayRange()).toEq([0, 13]);
      });

      it('should update when the scrollHeight property changes', function() {
        expect(view.displayRange()).toEq([0, 8]);
        view.scrollHeight(100);
        expect(view.displayRange()).toEq([0, 13]);
      });

      it('should update when the overflow property changes', function() {
        expect(view.displayRange()).toEq([0, 8]);
        view.overflow(2);
        expect(view.displayRange()).toEq([0, 6]);
      });

      it('should update when the content changes', function() {
        var content = view.content().slice();

        view.content(content);

        expect(view.displayRange()).toEq([0, 8]);
        view.content().pop(45);
        expect(view.displayRange()).toEq([0, 4]);
        view.content().pop(3)
        expect(view.displayRange()).toEq([0, 1]);
        view.content().clear();
        expect(view.displayRange()).toEq(null);
      });
    });

    describe('.rowHeightForIndex', function() {
      it('should return the rowHeight property', function() {
        expect(view.rowHeightForIndex(0)).toBe(10);
        expect(view.rowHeightForIndex(5)).toBe(10);
        expect(view.rowHeightForIndex(25)).toBe(10);
        expect(view.rowHeightForIndex(49)).toBe(10);
      });
    });

    describe('.rowOffsetForIndex', function() {
      it('should return the index times the rowHeight property', function() {
        expect(view.rowOffsetForIndex(0)).toBe(0);
        expect(view.rowOffsetForIndex(5)).toBe(50);
        expect(view.rowOffsetForIndex(25)).toBe(250);
        expect(view.rowOffsetForIndex(49)).toBe(490);
      });
    });
  });

  describe('with custom row heights', function() {
    beforeEach(function() {
      view.def('customRowHeightForIndex', function(i) {
        return i === 25 ? 5 : i * 10;
      });
      view.customRowHeightIndexes().push(5, 25, 40);
    });

    afterEach(function() {
      view.customRowHeightIndexes().clear();
    });

    describe('.customRowHeights', function() {
      it('should return a native object mapping each custom index to its custom height', function() {
        expect(view.customRowHeights()).toEq({5: 50, 25: 5, 40: 400});
      });
    });

    describe('.offsetAdjustments', function() {
      it('should return a list of ranges with their corresponding total offset from the default', function() {
        expect(view.offsetAdjustments()).toEq([
          [0,   5,   0],
          [6,  25,  40],
          [26, 40,  35],
          [41, 49, 425]
        ]);
      });

      it('should update when the content size changes', function() {
        var content = view.content().slice(0, 48);
        view.content(content);
        expect(view.offsetAdjustments()).toEq([
          [0,   5,   0],
          [6,  25,  40],
          [26, 40,  35],
          [41, 47, 425]
        ]);
      });

      it('should update when the rowHeight property changes', function() {
        view.rowHeight(20);
        expect(view.offsetAdjustments()).toEq([
          [0,   5,   0],
          [6,  25,  30],
          [26, 40,  15],
          [41, 49, 395]
        ]);
      });

      it('should update when the customRowHeightIndexes property changes', function() {
        view.customRowHeightIndexes().push(10);
        expect(view.offsetAdjustments()).toEq([
          [0,   5,   0],
          [6,  10,  40],
          [11, 25, 130],
          [26, 40, 125],
          [41, 49, 515]
        ]);
      });
    });

    describe('.displayRange', function() {
      it('should adjust the first and last indexes to account for the custom row heights', function() {
        expect(view.displayRange()).toEq([0, 8]);
        view.scrollOffset(60);
        expect(view.displayRange()).toEq([3, 11]);
        view.scrollOffset(290);
        expect(view.displayRange()).toEq([23, 32]);
      });
    });

    describe('.rowHeightForIndex', function() {
      it('should return the rowHeight property for non-custom rows', function() {
        expect(view.rowHeightForIndex(0)).toBe(10);
        expect(view.rowHeightForIndex(49)).toBe(10);
      });

      it('should return the return value of `customRowHeightForIndex` for custom rows', function() {
        expect(view.rowHeightForIndex(5)).toBe(50);
        expect(view.rowHeightForIndex(25)).toBe(5);
        expect(view.rowHeightForIndex(40)).toBe(400);
      });
    });

    describe('.rowOffsetForIndex', function() {
      it('should return the index times the rowHeight property plus the adjustment for the range the given index falls in', function() {
        expect(view.rowOffsetForIndex(0)).toBe(0);
        expect(view.rowOffsetForIndex(5)).toBe(50);
        expect(view.rowOffsetForIndex(6)).toBe(60 + 40);
        expect(view.rowOffsetForIndex(7)).toBe(70 + 40);
        expect(view.rowOffsetForIndex(25)).toBe(250 + 40);
        expect(view.rowOffsetForIndex(26)).toBe(260 + 35);
        expect(view.rowOffsetForIndex(42)).toBe(420 + 425);
      });
    });
  });

  describe('.update', function() {
    it('should set the content of the item views based the indexes returned by the displayRange property', function() {
      expect(view.subviews().at(0).content()).toBe(items.at(0));
      expect(view.subviews().at(1).content()).toBe(items.at(1));
      expect(view.subviews().at(2).content()).toBe(items.at(2));
      expect(view.subviews().at(3).content()).toBe(items.at(3));
      expect(view.subviews().at(4).content()).toBe(items.at(4));
      expect(view.subviews().at(5).content()).toBe(items.at(5));
      expect(view.subviews().at(6).content()).toBe(items.at(6));
      expect(view.subviews().at(7).content()).toBe(items.at(7));
      expect(view.subviews().at(8).content()).toBe(items.at(8));

      view.scrollOffset(40);
      view.display();

      expect(view.subviews().at(0).content()).toBe(items.at(9));
      expect(view.subviews().at(1).content()).toBe(items.at(10));
      expect(view.subviews().at(2).content()).toBe(items.at(2));
      expect(view.subviews().at(3).content()).toBe(items.at(3));
      expect(view.subviews().at(4).content()).toBe(items.at(4));
      expect(view.subviews().at(5).content()).toBe(items.at(5));
      expect(view.subviews().at(6).content()).toBe(items.at(6));
      expect(view.subviews().at(7).content()).toBe(items.at(7));
      expect(view.subviews().at(8).content()).toBe(items.at(8));

      view.scrollOffset(450);
      view.display();

      expect(view.subviews().at(0).content()).toBe(items.at(45));
      expect(view.subviews().at(1).content()).toBe(items.at(46));
      expect(view.subviews().at(2).content()).toBe(items.at(47));
      expect(view.subviews().at(3).content()).toBe(items.at(48));
      expect(view.subviews().at(4).content()).toBe(items.at(49));
      expect(view.subviews().at(5).content()).toBe(items.at(41));
      expect(view.subviews().at(6).content()).toBe(items.at(42));
      expect(view.subviews().at(7).content()).toBe(items.at(43));
      expect(view.subviews().at(8).content()).toBe(items.at(44));
    });

    it('should set the `top` style properties of each item view based on the return value of rowOffsetForIndex', function() {
      expect(view.subviews().at(0).node.style.top).toBe('0px');
      expect(view.subviews().at(1).node.style.top).toBe('10px');
      expect(view.subviews().at(2).node.style.top).toBe('20px');
      expect(view.subviews().at(3).node.style.top).toBe('30px');
      expect(view.subviews().at(4).node.style.top).toBe('40px');
      expect(view.subviews().at(5).node.style.top).toBe('50px');
      expect(view.subviews().at(6).node.style.top).toBe('60px');
      expect(view.subviews().at(7).node.style.top).toBe('70px');
      expect(view.subviews().at(8).node.style.top).toBe('80px');

      view.scrollOffset(450);
      view.display();

      expect(view.subviews().at(0).node.style.top).toBe('450px');
      expect(view.subviews().at(1).node.style.top).toBe('460px');
      expect(view.subviews().at(2).node.style.top).toBe('470px');
      expect(view.subviews().at(3).node.style.top).toBe('480px');
      expect(view.subviews().at(4).node.style.top).toBe('490px');
      expect(view.subviews().at(5).node.style.top).toBe('410px');
      expect(view.subviews().at(6).node.style.top).toBe('420px');
      expect(view.subviews().at(7).node.style.top).toBe('430px');
      expect(view.subviews().at(8).node.style.top).toBe('440px');
    });
  });

  describe('.scrollTo', function() {
    describe('with a content item', function() {
      it('should set the `scrollOffset` property to `rowHeight` times the index of the content item', function() {
        view.scrollTo(items.at(40));
        expect(view.scrollOffset()).toBe(400);
      });
    });

    describe('with a number', function() {
      it('should set the `scrollOffset` property `rowHeight` times the given number', function() {
        view.scrollTo(items.at(8));
        expect(view.scrollOffset()).toBe(80);
      });
    });
  });

  describe('.subviewForIndex', function() {
    it('should return the subview that is currently displaying the content item at the given index', function() {
      expect(view.subviewForIndex(0)).toBe(view.subviews().at(0));
      expect(view.subviewForIndex(1)).toBe(view.subviews().at(1));
      expect(view.subviewForIndex(25)).toBe(null);

      view.scrollOffset(450);
      view.display();

      expect(view.subviewForIndex(41)).toBe(view.subviews().at(5));
      expect(view.subviewForIndex(42)).toBe(view.subviews().at(6));
    });
  });

  describe('.indexForSubview', function() {
    it('should return the content index that the given subview is currently displaying', function() {
      expect(view.indexForSubview(view.subviews().at(0))).toBe(0);
      expect(view.indexForSubview(view.subviews().at(1))).toBe(1);
      expect(view.indexForSubview(Z.View.create())).toBe(null);

      view.scrollOffset(450);
      view.display();

      expect(view.indexForSubview(view.subviews().at(5))).toBe(41);
      expect(view.indexForSubview(view.subviews().at(6))).toBe(42);
    });
  });
});

}());
