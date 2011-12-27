(function() {

var Z = this.Z || require('zoom');

describe('Z.merge', function() {
  it('should merge values from sources objects into the given destination object', function() {
    var r;
    
    r = Z.merge({ foo: 1, bar: 2 }, { bar: 9, baz: 3 });
    expect(r).toEqual({ foo: 1, bar: 9, baz: 3 });

    r = Z.merge({ foo: 1, bar: 2 }, { bar: 9, baz: 3 }, { bar: 10, quux: 12 });
    expect(r).toEqual({ foo: 1, bar: 10, baz: 3, quux: 12 });
  });
});

describe('Z.defaults', function() {
  it('should merge values from default objects that are not present in the given object', function() {
    var r;

    r = Z.defaults({ foo: 1, bar: 2 }, { bar: 9, baz: 3 });
    expect(r).toEqual({ foo: 1, bar: 2, baz: 3 });
    r = Z.defaults({ foo: 1, bar: 2 }, { bar: 9, baz: 3 }, { quux: 12 });
    expect(r).toEqual({ foo: 1, bar: 2, baz: 3, quux: 12 });
  });
});

describe('Z.isNativeArray', function() {
  it('should return true for native arrays', function() {
    expect(Z.isNativeArray([1, 2, 3])).toBe(true);
  });

  it('should return false for arguments objects', function() {
    expect(Z.isNativeArray(arguments)).toBe(false);
  });

  // FIXME - uncomment once Z.Array is converted
  //it('should return false for Z.Arrays', function() {
  //  return expect(Z.isNativeArray(Z.A())).toBe(false);
  //});
});

// FIXME - uncomment once Z.Object is converted
//describe('Z.eq', function() {
//  var A;
//  A = (function() {

//    __extends(A, Z.Object);

//    function A() {
//      A.__super__.constructor.apply(this, arguments);
//    }

//    A.property('foo');

//    A.prototype.eq = function(other) {
//      return this.foo() === other.foo();
//    };

//    return A;

//  })();
//  it('should invoke #eq if the first object is a Z.Object', function() {
//    var a1, a2;
//    a1 = new A({
//      foo: 1
//    });
//    a2 = new A({
//      foo: 1
//    });
//    expect(a1 === a2).toBe(false);
//    expect(Z.eq(a1, a2)).toBe(true);
//    a2.foo(2);
//    expect(a1 === a2).toBe(false);
//    return expect(Z.eq(a1, a2)).toBe(false);
//  });
//  return it('should fall back to using the == operator if the first object is not a Z.Object', function() {
//    expect(Z.eq('foo', 'foo')).toBe(true);
//    expect(Z.eq('foo', 'bar')).toBe(false);
//    expect(Z.eq(9, 9)).toBe(true);
//    expect(Z.eq(9, 10)).toBe(false);
//    return expect(Z.eq(null, 0)).toBe(false);
//  });
//});

}());
