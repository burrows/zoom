(function() {

if (!this.Z) { require('./helper'); }

var Person, TestListView, TestItemView, p1, p2, p3, p4;

Person = Z.Object.extend(function() {
  this.prop('first');
  this.prop('last');
});

p1 = Person.create({first: 'Theon', last: 'Greyjoy'});
p2 = Person.create({first: 'Davos', last: 'Seaworth'});
p3 = Person.create({first: 'Meera', last: 'Reed'});
p4 = Person.create({first: 'Doran', last: 'Martell'});

TestItemView = Z.View.extend(function() {
  this.prop('content');

  this.def('tag', function() { return 'li'; });

  this.def('draw', function() {
    var p = this.content(),
        s = '<span class="first">%@</span><span class="last">%@</span>';
    this.node().innerHTML = Z.fmt(s, p.first(), p.last());
  });
});

TestListView = Z.ListView.extend(function() {
  this.def('itemViewType', function() { return TestItemView; })
});

describe('Z.ListView', function() {
  describe('.initialize without content', function() {
    it('should not create any subviews', function() {
      var v = TestListView.create();
      expect(v.subviews()).toEq(Z.A());
    });
  });

  describe('.initialize with content', function() {
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
      expect(v.get('subviews.size')).toBe(0);

      expect(function() { v.content().push(p3); }).not.toThrow();
    });
  });
});

}());
