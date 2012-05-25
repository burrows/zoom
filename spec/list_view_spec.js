(function() {

if (!this.Z) { require('./helper'); }

var Person, TestListView, TestItemView;

Person = Z.Object.extend(function() {
  this.prop('first');
  this.prop('last');
});

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
      var p1 = Person.create({first: 'Corey', last: 'Burrows'}),
          p2 = Person.create({first: 'Nicole', last: 'Burrows'});
          v  = TestListView.create({content: Z.A(p1, p2)});

      expect(v.get('subviews.size')).toBe(2);
      expect(v.subviews().pluck('content')).toEq(Z.A(p1, p2));
    });
  });
});

}());
