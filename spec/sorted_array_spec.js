(function() {

if (typeof Z === 'undefined') { require('./helper'); }

var Foo, Bar;

Foo = Z.Object.extend(function() { this.property('bar'); });
Bar = Z.Object.extend(function() { this.property('x'); });

describe('Z.SortedArray constructor with default options', function() {
  it('should insert items in sorted order as determined by `Z.cmp`', function() {
    var a1 = Z.SortedArray.create(),
        a2 = Z.SortedArray.create();

    a1.insert(9);
    expect(a1).toEq(Z.A(9));
    a1.insert(3);
    expect(a1).toEq(Z.A(3, 9));
    a1.insert(12);
    expect(a1).toEq(Z.A(3, 9, 12));
    a1.insert(2);
    expect(a1).toEq(Z.A(2, 3, 9, 12));

    a2.insert('the');
    expect(a2).toEq(Z.A('the'));
    a2.insert('quick');
    expect(a2).toEq(Z.A('quick', 'the'));
    a2.insert('brown');
    expect(a2).toEq(Z.A('brown', 'quick', 'the'));
    a2.insert('fox');
    expect(a2).toEq(Z.A('brown', 'fox', 'quick', 'the'));
  });
});

describe('Z.SortedArray constructor with `isDescending` option', function() {
  it('should insert items in sorted order as determined by `Z.cmp` but in descending order', function() {
    var a1 = Z.SortedArray.create({isDescending: true}),
        a2 = Z.SortedArray.create({isDescending: true});

    a1.insert(9);
    expect(a1).toEq(Z.A(9));
    a1.insert(3);
    expect(a1).toEq(Z.A(9, 3));
    a1.insert(12);
    expect(a1).toEq(Z.A(12, 9, 3));
    a1.insert(2);
    expect(a1).toEq(Z.A(12, 9, 3, 2));

    a2.insert('the');
    expect(a2).toEq(Z.A('the'));
    a2.insert('quick');
    expect(a2).toEq(Z.A('the', 'quick'));
    a2.insert('brown');
    expect(a2).toEq(Z.A('the', 'quick', 'brown'));
    a2.insert('fox');
    expect(a2).toEq(Z.A('the', 'quick', 'fox', 'brown'));
  });
});

describe('Z.SortedArray constructor with `path` option', function() {
  it('should insert items in sorted order as determined by comparing the values returned by getting the given path', function() {
    var a1 = Z.SortedArray.create({path: 'bar'}),
        a2 = Z.SortedArray.create({path: 'bar.x'});

    a1.insert(Foo.create({bar: 17}));
    expect(a1.pluck('bar')).toEq(Z.A(17));
    a1.insert(Foo.create({bar: 14}));
    expect(a1.pluck('bar')).toEq(Z.A(14, 17));
    a1.insert(Foo.create({bar: 15}));
    expect(a1.pluck('bar')).toEq(Z.A(14, 15, 17));
    a1.insert(Foo.create({bar: 11}));
    expect(a1.pluck('bar')).toEq(Z.A(11, 14, 15, 17));

    a2.insert(Foo.create({bar: Bar.create({x: 17})}));
    expect(a2.pluck('bar.x')).toEq(Z.A(17));
    a2.insert(Foo.create({bar: Bar.create({x: 14})}));
    expect(a2.pluck('bar.x')).toEq(Z.A(14, 17));
    a2.insert(Foo.create({bar: Bar.create({x: 15})}));
    expect(a2.pluck('bar.x')).toEq(Z.A(14, 15, 17));
    a2.insert(Foo.create({bar: Bar.create({x: 11})}));
    expect(a2.pluck('bar.x')).toEq(Z.A(11, 14, 15, 17));
  });

  it("should adjust the order accordingly when an item's path changes", function() {
    var a1 = Z.SortedArray.create({path: 'bar'}),
        a2 = Z.SortedArray.create({path: 'bar.x'});

    a1.insert(Foo.create({bar: 17}));
    a1.insert(Foo.create({bar: 14}));
    a1.insert(Foo.create({bar: 15}));
    a1.insert(Foo.create({bar: 11}));

    expect(a1.pluck('bar')).toEq(Z.A(11, 14, 15, 17));
    a1.at(0).bar(21);
    expect(a1.pluck('bar')).toEq(Z.A(14, 15, 17, 21));

    a2.insert(Foo.create({bar: Bar.create({x: 17})}));
    a2.insert(Foo.create({bar: Bar.create({x: 14})}));
    a2.insert(Foo.create({bar: Bar.create({x: 15})}));
    a2.insert(Foo.create({bar: Bar.create({x: 11})}));

    expect(a2.pluck('bar.x')).toEq(Z.A(11, 14, 15, 17));
    a2.set('last.bar.x', 12);
    expect(a2.pluck('bar.x')).toEq(Z.A(11, 12, 14, 15));
  });
});

describe('Z.SortedArray constructor with `path` and `isDescending` options', function() {
  it('should insert items in sorted order as determined by comparing the values returned by getting the given path but in descending order', function() {
    var a1 = Z.SortedArray.create({path: 'bar', isDescending: true}),
        a2 = Z.SortedArray.create({path: 'bar.x', isDescending: true});

    a1.insert(Foo.create({bar: 17}));
    expect(a1.pluck('bar')).toEq(Z.A(17));
    a1.insert(Foo.create({bar: 14}));
    expect(a1.pluck('bar')).toEq(Z.A(17, 14));
    a1.insert(Foo.create({bar: 15}));
    expect(a1.pluck('bar')).toEq(Z.A(17, 15, 14));
    a1.insert(Foo.create({bar: 11}));
    expect(a1.pluck('bar')).toEq(Z.A(17, 15, 14, 11));

    a2.insert(Foo.create({bar: Bar.create({x: 17})}));
    expect(a2.pluck('bar.x')).toEq(Z.A(17));
    a2.insert(Foo.create({bar: Bar.create({x: 14})}));
    expect(a2.pluck('bar.x')).toEq(Z.A(17, 14));
    a2.insert(Foo.create({bar: Bar.create({x: 15})}));
    expect(a2.pluck('bar.x')).toEq(Z.A(17, 15, 14));
    a2.insert(Foo.create({bar: Bar.create({x: 11})}));
    expect(a2.pluck('bar.x')).toEq(Z.A(17, 15, 14, 11));
  });

  it("should adjust the order accordingly when an item's path changes", function() {
    var a1 = Z.SortedArray.create({path: 'bar', isDescending: true}),
        a2 = Z.SortedArray.create({path: 'bar.x', isDescending: true});

    a1.insert(Foo.create({bar: 17}));
    a1.insert(Foo.create({bar: 14}));
    a1.insert(Foo.create({bar: 15}));
    a1.insert(Foo.create({bar: 11}));

    expect(a1.pluck('bar')).toEq(Z.A(17, 15, 14, 11));
    a1.at(0).bar(13);
    expect(a1.pluck('bar')).toEq(Z.A(15, 14, 13, 11));

    a2.insert(Foo.create({bar: Bar.create({x: 17})}));
    a2.insert(Foo.create({bar: Bar.create({x: 14})}));
    a2.insert(Foo.create({bar: Bar.create({x: 15})}));
    a2.insert(Foo.create({bar: Bar.create({x: 11})}));

    expect(a2.pluck('bar.x')).toEq(Z.A(17, 15, 14, 11));
    a2.set('last.bar.x', 16);
    expect(a2.pluck('bar.x')).toEq(Z.A(17, 16, 15, 14));
  });
});

describe('Z.SortedArray constructor with `compareFn` option', function() {
  it('should insert items in sorted order as determined by the given function', function() {
    var a = Z.SortedArray.create({
      compareFn: function(a, b) {
        return Z.cmp(b.get('bar.x'), a.get('bar.x'));
      }
    });

    a.insert(Foo.create({bar: Bar.create({x: 17})}));
    expect(a.pluck('bar.x')).toEq(Z.A(17));
    a.insert(Foo.create({bar: Bar.create({x: 14})}));
    expect(a.pluck('bar.x')).toEq(Z.A(17, 14));
    a.insert(Foo.create({bar: Bar.create({x: 15})}));
    expect(a.pluck('bar.x')).toEq(Z.A(17, 15, 14));
    a.insert(Foo.create({bar: Bar.create({x: 11})}));
    expect(a.pluck('bar.x')).toEq(Z.A(17, 15, 14, 11));
  });

  describe('and `dependsOn` option', function() {
    it("should adjust the order accordingly when any of the dependent paths change", function() {
      var a = Z.SortedArray.create({
        dependsOn: ['bar.x'],
        compareFn: function(a, b) {
          return Z.cmp(b.get('bar.x'), a.get('bar.x'));
        }
      });

      a.insert(Foo.create({bar: Bar.create({x: 17})}));
      a.insert(Foo.create({bar: Bar.create({x: 14})}));
      a.insert(Foo.create({bar: Bar.create({x: 15})}));
      a.insert(Foo.create({bar: Bar.create({x: 11})}));

      expect(a.pluck('bar.x')).toEq(Z.A(17, 15, 14, 11));
      a.set('last.bar.x', 16);
      expect(a.pluck('bar.x')).toEq(Z.A(17, 16, 15, 14));
    });
  });
});

describe('Z.Array.index', function() {
  var a = Z.SortedArray.create();

  a.insert(5);
  a.insert(21);
  a.insert(17);
  a.insert(111);

  it('should return `null` if the given object is not in the array', function() {
    expect(a.index(6)).toBeNull();
    expect(a.index('foo')).toBeNull();
    expect(a.index(null)).toBeNull();
    expect(a.index({})).toBeNull();
    expect(a.index(Z.Object.create())).toBeNull();
  });

  it('should return the current index of the item in the array', function() {
    expect(a.index(5)).toBe(0);
    expect(a.index(17)).toBe(1);
    expect(a.index(21)).toBe(2);
    expect(a.index(111)).toBe(3);
  });
});

describe('Z.SortedArray.push', function() {
  it('should throw an exception', function() {
    expect(function() {
      Z.SortedArray.create().push(9);
    }).toThrow('Z.SortedArray.push: use `insert` to add items to a sorted array');
  });
});

describe('Z.SortedArray.unshift', function() {
  it('should throw an exception', function() {
    expect(function() {
      Z.SortedArray.create().unshift(9);
    }).toThrow('Z.SortedArray.unshift: use `insert` to add items to a sorted array');
  });
});

describe('Z.SortedArray.at', function() {
  it('should throw an exception when given two arguments', function() {
    expect(function() {
      Z.SortedArray.create().at(0, 9);
    }).toThrow('Z.SortedArray.at: use `insert` to add items to a sorted array');
  });
});

describe('Z.SortedArray.sort$', function() {
  it('should throw an exception', function() {
    expect(function() {
      Z.SortedArray.create().sort$();
    }).toThrow("Z.SortedArray.sort$: can't sort a sorted array in place");
  });
});

}());
