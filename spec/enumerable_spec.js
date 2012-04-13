(function() {

var Foo, f, a;

if (typeof Z === 'undefined') { require('./helper'); }

Foo = Z.Object.extend(Z.Enumerable, function() {
  this.prop('x');
  this.def('each', function(f) {
    f('foo'); f('bar'); f('baz'); f('quux');
  });
});

f = Foo.create();
a = Z.A(1,2,3,4,5,6,7,8,9,10);
h = Z.H('foo', 1, 'bar', 2, 'baz', 3);

describe('Z.Enumerable.inject', function() {
  it('should reduce the enumerable using the given initial object and function', function() {
    expect(f.inject('', function(acc, x) { return acc + x; })).toEqual('foobarbazquux');
    expect(a.inject(0, function(acc, x) { return acc + x; })).toBe(55);
  });

  it("should use the first item in the enumerable as the initial value if one isn't given", function() {
    expect(f.inject(function(acc, x) { return acc + x; })).toEqual('foobarbazquux');
    expect(a.inject(function(acc, x) { return acc + x; })).toBe(55);
  });
});

describe('Z.Enumerable.map', function() {
  it('should return a Z.Array containing the result of applying the given function to each item in the enumerable', function() {
    expect(f.map(function(x) { return x.toUpperCase(); })).toEq(Z.A(['FOO', 'BAR', 'BAZ', 'QUUX']));
    expect(a.map(function(x) { return x * 10; })).toEq(Z.A(10, 20, 30, 40, 50, 60, 70, 80, 90, 100));
  });
});

describe('Z.Enumerable.first', function() {
  it('should return the first item in the enumerable', function() {
    expect(Foo.create().first()).toEqual('foo');
  });

  it('should return null when the enumerable is empty', function() {
    var Empty = Z.Object.extend(Z.Enumerable, function() {
      this.def('each', function(f) {});
    });

    expect(Empty.create().first()).toBe(null);
  });
});

describe('Z.Enumerable.reject', function() {
  it('should return a Z.Array containing all of the values in the enumerable except those that the given predicate function passes for', function() {
    expect(f.reject(function(x) { return x[0] === 'b'; })).toEq(Z.A('foo', 'quux'));
    expect(a.reject(function(x) { return x % 2 !== 0; })).toEq(Z.A(2, 4, 6, 8, 10));
  });
});

describe('Z.Enumerable.invoke', function() {
  it('should call the given method on each item in the array and return a new array contain the results', function() {
    var o1 = Z.Object.create(), o2 = Z.Object.create(), o3 = Z.Object.create(),
        a = Z.A(o1, o2, o3);
    expect(a.invoke('objectId')).toEq(Z.A(o1.objectId(), o2.objectId(), o3.objectId()));
  });
});

describe('Z.Enumerable.pluck', function() {
  var a;

  it('should get the given property from each item in the array and return a new array containing the values', function() {
    a = Z.A(Foo.create({x: 1}), Foo.create({x: 2}), Foo.create({x: 3}));
    expect(a.pluck('x')).toEq(Z.A(1, 2, 3));
  });

  it('should pass through null and undefined values', function() {
    a = Z.A(Foo.create({x: 1}), null, Foo.create({x: 2}), undefined, Foo.create({x: 3}));
    expect(a.pluck('x')).toEq(Z.A(1, null, 2, void 0, 3));
  });

  it('should access properties of native objects', function() {
    a = Z.A({foo: 1}, {foo: 121});
    expect(a.pluck('foo')).toEq(Z.A(1, 121));
  });
});

describe('Z.Enumerable.toArray', function() {
  it('should return a `Z.Array` containing each item yielded to `each`', function() {
    var X = Z.Object.extend(Z.Enumerable, function() {
      this.def('each', function(f) { f([1, 2]); f([3, 4]); });
    });

    expect(f.toArray()).toEq(Z.A('foo', 'bar', 'baz', 'quux'));
    expect(X.create().toArray()).toEq(Z.A([1, 2], [3, 4]));
  });
});

describe('Z.Enumerable.sort', function() {
  describe('given no arguments', function() {
    it('should convert the receiver to an array and sort it using `Z.cmp`', function() {
      expect(f.sort()).toEq(Z.A('bar', 'baz', 'foo', 'quux'));
    });
  });

  describe('given a function argument', function() {
    it('should convert the receiver to an array and sort it using the given function', function() {
      expect(Z.H('foo', 3, 'bar', 2, 'baz', 1).sort(function(a, b) {
        return Z.cmp(a[1], b[1]);
      })).toEq(Z.A(['baz', 1], ['bar', 2], ['foo', 3]));
    });
  });
});

describe('Z.Enumerable.find', function() {
  describe('given only a function argument', function() {
    it('should return the first item in the enumerable for which the function returns true', function() {
      expect(a.find(function(item) { return item % 4 === 0; })).toBe(4);
      expect(h.find(function(tuple) { return tuple[1] === 2; })).toEq(['bar', 2]);
      expect(f.find(function(item) { return item === 'quux'; })).toBe('quux');
    });

    it('should return null if the function does not return true for any item in the enumerable', function() {
      expect(a.find(function(item) { return item % 12 === 0; })).toBeNull();
      expect(h.find(function(tuple) { return tuple[1] === 9; })).toBeNull();
      expect(f.find(function(item) { return item === 'hello'; })).toBeNull();
    });
  });

  describe('given a value and a function argument', function() {
    it('should return the first item in the enumerable for which the function returns true', function() {
      expect(a.find('x', function(item) { return item % 4 === 0; })).toBe(4);
      expect(h.find('y', function(tuple) { return tuple[1] === 2; })).toEq(['bar', 2]);
      expect(f.find(9, function(item) { return item === 'quux'; })).toBe('quux');
    });

    it('should return the first argument if the function does not return true for any item in the enumerable', function() {
      expect(a.find('x', function(item) { return item % 12 === 0; })).toBe('x');
      expect(h.find('y', function(tuple) { return tuple[1] === 9; })).toBe('y');
      expect(f.find(9, function(item) { return item === 'hello'; })).toBe(9);
    });
  });
});

describe('Z.Enumerable.all', function() {
  it('should return `true` if the given function returns `true` for every item and false otherwise', function() {
    expect(Z.A().all(function(x) { return false; })).toBe(true);
    expect(f.all(function(x) { return x.length >= 3; })).toBe(true);
    expect(f.all(function(x) { return x.length >= 4; })).toBe(false);
  });
});

describe('Z.Enumerable.all', function() {
  it('should return `true` if the given function returns `true` for any item and false otherwise', function() {
    expect(Z.A().any(function(x) { return true; })).toBe(false);
    expect(f.any(function(x) { return x === 'bar'; })).toBe(true);
    expect(f.any(function(x) { return x === 'blarf'; })).toBe(false);
  });
});

}());
