(function() {

if (!this.Z) { require('./helper'); }

var Person, TestListView, TestItemView, p1, p2, p3, p4;

Person = Z.Object.extend(Z.Observable, function() {
  this.prop('first');
  this.prop('last');
});

p1 = Person.create({first: 'Theon', last: 'Greyjoy'});
p2 = Person.create({first: 'Davos', last: 'Seaworth'});
p3 = Person.create({first: 'Meera', last: 'Reed'});
p4 = Person.create({first: 'Doran', last: 'Martell'});

TestItemView = Z.View.extend(function() {
  this.tag = 'li';

  this.prop('content');
  this.prop('isSelected', {def: false});

  this.def('render', function() {
    var p = this.content(),
        s = '<span class="first">%@</span><span class="last">%@</span>';
    this.node.innerHTML = Z.fmt(s, p.first(), p.last());
  });
});

TestListView = Z.ListView.extend(function() {
  this.itemViewType(TestItemView);
});

describe('Z.ListView', function() {
  describe('.init without content', function() {
    it('should not create any subviews when `emptyView` is `null`', function() {
      var v = TestListView.create();
      expect(v.subviews()).toEq(Z.A());
    });

    it('should add `emptyView` as a subview', function() {
      var empty = Z.View.create(),
          v     = TestListView.create({emptyView: empty});

      expect(v.subviews()).toEq(Z.A(empty));
    });
  });

  describe('.init with content', function() {
    it('should create subviews for each item in the content', function() {
      var v = TestListView.create({content: Z.A(p1, p2)});

      expect(v.get('subviews.size')).toBe(2);
      expect(v.subviews().pluck('content')).toEq(Z.A(p1, p2));
    });
  });

  describe('adding content items', function() {
    it('should create a new item view and add it to the `subviews`', function() {
      var v = TestListView.create({content: Z.A(p1, p2)});

      expect(v.get('subviews.size')).toBe(2);
      expect(v.subviews().pluck('content')).toEq(Z.A(p1, p2));

      v.content().push(p3);

      expect(v.get('subviews.size')).toBe(3);
      expect(v.subviews().pluck('content')).toEq(Z.A(p1, p2, p3));
    });

    it('should invoke the `createItemView` method to create the item view', function() {
      var v = TestListView.create({content: Z.A()});

      spyOn(v, 'createItemView').andCallThrough();
      v.content().push(p1);
      expect(v.createItemView).toHaveBeenCalledWith(p1);
    });

    it('should remove the `emptyView` when displayed', function() {
      var empty = Z.View.create(),
          view  = TestListView.create({content: Z.A(), emptyView: empty});

      expect(empty.superview()).toBe(view);
      view.content().push(p1, p2);
      expect(empty.superview()).toBe(null);
    });

    it('should not destroy the `emptyView`', function() {
      var empty = Z.View.create(),
          view  = TestListView.create({content: Z.A(), emptyView: empty});

      spyOn(empty, 'destroy');
      view.content().push(p1, p2);
      expect(empty.destroy).not.toHaveBeenCalled();
    });

    it('should set `showingEmpty` to `false` when removing the empty view', function() {
      var empty = Z.View.create(),
          view  = TestListView.create({content: Z.A(), emptyView: empty});

      expect(view.showingEmpty()).toBe(true);
      view.content().push(p1, p2);
      expect(view.showingEmpty()).toBe(false);
    });
  });

  describe('.createItemView', function() {
    it('should throw an exception when `itemViewType` is `null`', function() {
      var v = TestListView.create({content: Z.A(), itemViewType: null});

      expect(function() {
        v.createItemView(p1);
      }).toThrow(Z.fmt("Z.ListView.createItemView: `itemViewType` is not defined: %@", v));
    });
  });

  describe('removing content items', function() {
    it('should remove the corresponding item view from `subviews`', function() {
      var v = TestListView.create({content: Z.A(p1, p2)});

      expect(v.get('subviews.size')).toBe(2);
      expect(v.subviews().pluck('content')).toEq(Z.A(p1, p2));

      v.content().pop();

      expect(v.get('subviews.size')).toBe(1);
      expect(v.subviews().pluck('content')).toEq(Z.A(p1));
    });

    it('should invoke `destroy` on the removed item view', function() {
      var v  = TestListView.create({content: Z.A(p1, p2)}),
          iv = v.subviews().at(1);

      spyOn(iv, 'destroy');
      v.content().pop();
      expect(iv.destroy).toHaveBeenCalled();
    });

    it('should display the `emptyView` when set and `content` is empty or `null`', function() {
      var empty = Z.View.create(),
          v     = TestListView.create({content: Z.A(p1, p2), emptyView: empty});

      expect(v.subviews().size()).toBe(2);
      v.content().clear();
      expect(v.subviews()).toEq(Z.A(empty));
    });

    it('should set `showingEmpty` to `true` when adding the empty view', function() {
      var empty = Z.View.create(),
          view  = TestListView.create({content: Z.A(p1, p2), emptyView: empty});

      expect(view.showingEmpty()).toBe(false);
      view.content(null);
      expect(view.showingEmpty()).toBe(true);
    });
  });

  describe('replacing content items', function() {
    it('should remove the corresponding item view from `subviews` and replace it with a new item view', function() {
      var v = TestListView.create({content: Z.A(p1, p2)});

      expect(v.get('subviews.size')).toBe(2);
      expect(v.subviews().pluck('content')).toEq(Z.A(p1, p2));

      v.content().at(1, p3);

      expect(v.get('subviews.size')).toBe(2);
      expect(v.subviews().pluck('content')).toEq(Z.A(p1, p3));
    });

    it('should invoke `destroy` on the replaced item view', function() {
      var v  = TestListView.create({content: Z.A(p1, p2)}),
          iv = v.subviews().at(1);

      spyOn(iv, 'destroy');
      v.content().at(1, p3);
      expect(iv.destroy).toHaveBeenCalled();
    });
  });

  describe('replacing content with `null`', function() {
    it('should clear the `subviews` array', function() {
      var v = TestListView.create({content: Z.A(p1, p2)});

      expect(v.get('subviews.size')).toBe(2);
      v.content(null);
      expect(v.get('subviews.size')).toBe(0);
    });

    it('should invoke `destroy` on all of the existing subviews', function() {
      var v   = TestListView.create({content: Z.A(p1, p2)}),
          iv1 = v.subviews().at(0),
          iv2 = v.subviews().at(1);

      spyOn(iv1, 'destroy');
      spyOn(iv2, 'destroy');
      v.content(null);
      expect(iv1.destroy).toHaveBeenCalled();
      expect(iv2.destroy).toHaveBeenCalled();
    });

    it('should show the `emptyView` when set', function() {
      var empty = Z.View.create(),
          v     = TestListView.create({content: Z.A(p1, p2), emptyView: empty});

      expect(v.get('subviews.size')).toBe(2);
      v.content(null);
      expect(v.subviews()).toEq(Z.A(empty));
    });

    it('should not remove the `emptyView` when an empty content is changed to another empty content', function() {
      var empty = Z.View.create(),
          v     = TestListView.create({emptyView: empty});

      expect(v.subviews()).toEq(Z.A(empty));
      v.content(Z.A());
      expect(v.subviews()).toEq(Z.A(empty));
    });
  });

  describe('replacing content with a new array', function() {
    it('replace all of the item views in `subviews`', function() {
      var v = TestListView.create({content: Z.A(p1, p2)});

      expect(v.get('subviews.size')).toBe(2);
      expect(v.subviews().pluck('content')).toEq(Z.A(p1, p2));

      v.content(Z.A(p3, p4));

      expect(v.get('subviews.size')).toBe(2);
      expect(v.subviews().pluck('content')).toEq(Z.A(p3, p4));
    });
  });

  describe('.destroy', function() {
    it('should stop observing the content', function() {
      var v = TestListView.create({content: Z.A(p1, p2)});

      expect(v.get('subviews.size')).toBe(2);
      v.destroy();
      v.content().push(p3)
      expect(v.get('subviews.size')).toBe(2);
    });
  });

  describe('changing `itemViewType` property', function() {
    it('should replace all current subviews with instances of the new item view type', function() {
      var v   = TestListView.create({content: Z.A(p1, p2)}),
          ivt = Z.View.extend(function() { this.prop('content'); });

      expect(v.get('subviews.size')).toBe(2);
      expect(v.get('subviews.type')).toEq(Z.A(TestItemView, TestItemView));
      v.itemViewType(ivt);
      expect(v.get('subviews.size')).toBe(2);
      expect(v.get('subviews.type')).toEq(Z.A(ivt, ivt));
    });

    it('should do nothing when the emptyView is currently being displayed', function() {
      var empty = Z.View.create(),
          v     = TestListView.create({content: Z.A(), emptyView: empty}),
          ivt   = Z.View.extend(function() { this.prop('content'); });

      expect(v.subviews()).toEq(Z.A(empty));
      v.itemViewType(ivt);
      expect(v.subviews()).toEq(Z.A(empty));
    });
  });

  describe('.subviewForContentIndex', function() {
    it('should return the subview at the given index', function() {
      var v = TestListView.create({content: Z.A(p1, p2, p3, p4)});

      expect(v.subviewForContentIndex(0)).toBe(v.subviews().at(0));
      expect(v.subviewForContentIndex(1)).toBe(v.subviews().at(1));
      expect(v.subviewForContentIndex(2)).toBe(v.subviews().at(2));
      expect(v.subviewForContentIndex(3)).toBe(v.subviews().at(3));
      expect(v.subviewForContentIndex(4)).toBe(null);
    });
  });

  describe('.selectionIndexes', function() {
    it('should default to an empty array', function() {
      var v = TestListView.create();
      expect(v.selectionIndexes()).toEq(Z.A());
    });

    it('should mark the view as needing an update when modified', function() {
      var v = TestListView.create({content: Z.A(p1, p2)});
      v.display();
      expect(v.needsDisplay()).toBe(false)
      v.selectionIndexes().push(0);
      expect(v.needsDisplay()).toBe(true)
    });
  });

  describe('.update', function() {
    var view;

    beforeEach(function() {
      view = TestListView.create({content: Z.A(p1, p2, p3, p4)});
      view.display();
    });

    it('should apply current selections by setting the `isSelected` property on the subviews indicated by `selectionIndexes`', function() {
      expect(view.get('subviews.isSelected')).toEq(Z.A(false, false, false, false));
      view.selectionIndexes(Z.A(1, 3));
      view.display();
      expect(view.get('subviews.isSelected')).toEq(Z.A(false, true, false, true));
    });

    it('should unset the `isSelected` property on subviews that are no longer selected', function() {
      expect(view.get('subviews.isSelected')).toEq(Z.A(false, false, false, false));
      view.selectionIndexes(Z.A(0, 1));
      view.display();
      expect(view.get('subviews.isSelected')).toEq(Z.A(true, true, false, false));
      view.selectionIndexes(Z.A(1, 2));
      view.display();
      expect(view.get('subviews.isSelected')).toEq(Z.A(false, true, true, false));
      view.selectionIndexes().clear();
      view.display();
      expect(view.get('subviews.isSelected')).toEq(Z.A(false, false, false, false));
    });
  });
});

}());
