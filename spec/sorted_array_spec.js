(function() {

if (typeof Z === 'undefined') { require('./helper'); }

describe('Z.SortedArray constructor', function() {
  describe('with no arguments', function() {
    it('should set the comparison function to `Z.cmp`', function() {
      var a = Z.SortedArray.create();
      expect(a.cmp).toBe(Z.cmp);
    });
  });

  describe('given a comparison function', function() {
    it('should set the comparison function to the given function', function() {
      var f = function() {}, a = Z.SortedArray.create(f);
      expect(a.cmp).toBe(f);
    });
  });
});

describe('Z.SortedArray.insert', function() {
  it('should maintain sorted order of the items as determined by the comparison function', function() {
    var a1 = Z.SortedArray.create(),
        a2 = Z.SortedArray.create(function(a, b) { return Z.cmp(b, a); });

    expect(a1.toArray()).toEq(Z.A());
    expect(a2.toArray()).toEq(Z.A());
    a1.insert(10);
    a2.insert(10);
    expect(a1.toArray()).toEq(Z.A(10));
    expect(a2.toArray()).toEq(Z.A(10));
    a1.insert(12);
    a2.insert(12);
    expect(a1.toArray()).toEq(Z.A(10, 12));
    expect(a2.toArray()).toEq(Z.A(12, 10));
    a1.insert(7);
    a2.insert(7);
    expect(a1.toArray()).toEq(Z.A(7, 10, 12));
    expect(a2.toArray()).toEq(Z.A(12, 10, 7));
    a1.insert(11);
    a2.insert(11);
    expect(a1.toArray()).toEq(Z.A(7, 10, 11, 12));
    expect(a2.toArray()).toEq(Z.A(12, 11, 10, 7));
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
