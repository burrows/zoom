(function() {

if (!this.Z) { require('./helper'); }

describe('Z.FastListView', function() {
  var items = Z.A(), ItemView, i;

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
    }).create({content: items, height: 50, rowHeight: 10, overflow: 2});

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

  it('should only add enough item views to fill the height of the view plus the number of overflow items', function() {
    expect(view.get('subviews.size')).toBe(7); // 5 to fill the 50px height + 2 overflow
  });

  it('should set the content of the item views based on the `top` and `overflow` properties', function() {
    expect(view.subviews().at(0).content()).toBe(items.at(0));
    expect(view.subviews().at(1).content()).toBe(items.at(1));
    expect(view.subviews().at(2).content()).toBe(items.at(2));
    expect(view.subviews().at(3).content()).toBe(items.at(3));
    expect(view.subviews().at(4).content()).toBe(items.at(4));
    expect(view.subviews().at(5).content()).toBe(items.at(5));
    expect(view.subviews().at(6).content()).toBe(items.at(6));

    view.top(20);
    view.display();

    expect(view.subviews().at(0).content()).toBe(items.at(7));
    expect(view.subviews().at(1).content()).toBe(items.at(1));
    expect(view.subviews().at(2).content()).toBe(items.at(2));
    expect(view.subviews().at(3).content()).toBe(items.at(3));
    expect(view.subviews().at(4).content()).toBe(items.at(4));
    expect(view.subviews().at(5).content()).toBe(items.at(5));
    expect(view.subviews().at(6).content()).toBe(items.at(6));

    view.top(40);
    view.display();

    expect(view.subviews().at(0).content()).toBe(items.at(7));
    expect(view.subviews().at(1).content()).toBe(items.at(8));
    expect(view.subviews().at(2).content()).toBe(items.at(9));
    expect(view.subviews().at(3).content()).toBe(items.at(3));
    expect(view.subviews().at(4).content()).toBe(items.at(4));
    expect(view.subviews().at(5).content()).toBe(items.at(5));
    expect(view.subviews().at(6).content()).toBe(items.at(6));

    view.top(40);
    view.overflow(0);
    view.display();

    expect(view.subviews().at(0).content()).toBe(items.at(5));
    expect(view.subviews().at(1).content()).toBe(items.at(6));
    expect(view.subviews().at(2).content()).toBe(items.at(7));
    expect(view.subviews().at(3).content()).toBe(items.at(8));
    expect(view.subviews().at(4).content()).toBe(items.at(4));
  });

  it('should set the `top` style properties of each item view based on the `rowHeight` and content index', function() {
    expect(view.subviews().at(0).node.style.top).toBe('0px');
    expect(view.subviews().at(1).node.style.top).toBe('10px');
    expect(view.subviews().at(2).node.style.top).toBe('20px');
    expect(view.subviews().at(3).node.style.top).toBe('30px');
    expect(view.subviews().at(4).node.style.top).toBe('40px');
    expect(view.subviews().at(5).node.style.top).toBe('50px');
    expect(view.subviews().at(6).node.style.top).toBe('60px');

    view.top(20);
    view.display();

    expect(view.subviews().at(0).node.style.top).toBe('70px');
    expect(view.subviews().at(1).node.style.top).toBe('10px');
    expect(view.subviews().at(2).node.style.top).toBe('20px');
    expect(view.subviews().at(3).node.style.top).toBe('30px');
    expect(view.subviews().at(4).node.style.top).toBe('40px');
    expect(view.subviews().at(5).node.style.top).toBe('50px');
    expect(view.subviews().at(6).node.style.top).toBe('60px');
  });

  describe('changing the content', function() {
    it('should change the height of the container div', function() {
      expect(view.node.childNodes[0].style.height).toBe('500px');
      view.content(items.slice(0, 5));
      view.display();
      expect(view.node.childNodes[0].style.height).toBe('50px');
    });

    it('should change the content of the subviews', function() {
      expect(view.subviews().at(0).content()).toBe(items.at(0));
      expect(view.subviews().at(1).content()).toBe(items.at(1));
      expect(view.subviews().at(2).content()).toBe(items.at(2));
      expect(view.subviews().at(3).content()).toBe(items.at(3));
      expect(view.subviews().at(4).content()).toBe(items.at(4));
      expect(view.subviews().at(5).content()).toBe(items.at(5));
      expect(view.subviews().at(6).content()).toBe(items.at(6));

      view.content(items.slice(10, 10));
      view.display();

      expect(view.subviews().at(0).content()).toBe(items.at(10));
      expect(view.subviews().at(1).content()).toBe(items.at(11));
      expect(view.subviews().at(2).content()).toBe(items.at(12));
      expect(view.subviews().at(3).content()).toBe(items.at(13));
      expect(view.subviews().at(4).content()).toBe(items.at(14));
      expect(view.subviews().at(5).content()).toBe(items.at(15));
      expect(view.subviews().at(6).content()).toBe(items.at(16));
    });

    it('should remove subviews if there are no longer enough items to fill the height', function() {
      expect(view.get('subviews.size')).toBe(7);
      view.content(items.slice(10, 2));
      view.display();
      expect(view.get('subviews.size')).toBe(2);
    });

    it('should add subviews if necessary in order to fill the height when there are enough content items', function() {
      view.content(items.slice(10, 2));
      view.display();
      expect(view.get('subviews.size')).toBe(2);
      view.content(items.slice(10, 50));
      view.display();
      expect(view.get('subviews.size')).toBe(7);
    });
  });

  describe('changing the `rowHeight` property', function() {
    it('should change the height of the container div', function() {
      expect(view.node.childNodes[0].style.height).toBe('500px');
      view.rowHeight(20);
      view.display();
      expect(view.node.childNodes[0].style.height).toBe('1000px');
    });

    it('should change the number of subviews', function() {
      expect(view.get('subviews.size')).toBe(7);
      view.rowHeight(5);
      view.display();
      expect(view.get('subviews.size')).toBe(12); // 10 items to fill 50px + 2 overflow
    });
  });

  describe('changing the `overflow` property', function() {
    it('should change the number of subviews', function() {
      expect(view.get('subviews.size')).toBe(7);
      view.rowHeight(4);
      view.display();
      expect(view.get('subviews.size')).toBe(14); // 10 items to fill 50px + 4 overflow
    });
  });

  describe('.scrollTo', function() {
    describe('with a content item', function() {
      it('should set the `top` property to `rowHeight` times the index of the content item', function() {
        view.scrollTo(items.at(40));
        expect(view.top()).toBe(400);
      });
    });

    describe('with a number', function() {
      it('should set the `top` property `rowHeight` times the given number', function() {
        view.scrollTo(items.at(8));
        expect(view.top()).toBe(80);
      });
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

      expect(view.get('subviews.size')).toBe(7);
      expect(view.get('subviews.type').uniq()).toEq(Z.A(ItemView));
      view.itemViewType(ivt);
      expect(view.get('subviews.size')).toBe(7);
      expect(view.get('subviews.type').uniq()).toEq(Z.A(ivt));
    });
  });
});

}());
