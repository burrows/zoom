(function() {

var Foo, f, a;

if (typeof Z === 'undefined') { require('./helper'); }

Foo = Z.Object.extend(Z.Enumerable, function() {
  this.property('x');
  this.def('each', function(f) {
    f('foo'); f('bar'); f('baz'); f('quux');
  });
});

f = Foo.create();
a = Z.A(1,2,3,4,5,6,7,8,9,10);

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
});

describe('Z.Enumerable.reject', function() {
  it('should return a Z.Array containing all of the values in the enumerable except those that the given predicate function passes for', function() {
    expect(f.reject(function(x) { return x[0] === 'b'; })).toEq(Z.A('foo', 'quux'));
    expect(a.reject(function(x) { return x % 2 !== 0; })).toEq(Z.A(2, 4, 6, 8, 10));
  });
});

describe('Z.Enumerable.invoke', function() {
  it('should call the given method on each item in the array and return a new array contain the results', function() {
    var o1 = Z.Object.create(), o2 = Z.Object.create(), o3 = Z.Object.create();
    a = Z.A(o1, o2, o3);
    expect(a.invoke('objectId')).toEq(Z.A(o1.objectId(), o2.objectId(), o3.objectId()));
  });
});

describe('Z.Enumerable.pluck', function() {
  it('should get the given property from each item in the array and return a new array contain the values', function() {
    a = Z.A(Foo.create({x: 1}), Foo.create({x: 2}), Foo.create({x: 3}));
    expect(a.pluck('x')).toEq(Z.A(1, 2, 3));
  });

  it('should should pass through null and undefined values', function() {
    a = Z.A(Foo.create({x: 1}), null, Foo.create({x: 2}), undefined, Foo.create({x: 3}));
    expect(a.pluck('x')).toEq(Z.A(1, null, 2, void 0, 3));
  });
});

}());
