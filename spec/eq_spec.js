(function() {

var Z = this.Z || require('zoom');

describe('Z.eq', function() {
  var A = Z.Object.extend(function() {
    this.property('foo');
    this.def('eq', function(other) {
      return this.foo() === other.foo();
    });
  });

  it('should invoke #eq if the first object is a Z.Object', function() {
    var a1 = A.create({foo: 1}), a2 = A.create({foo: 1});

    expect(a1 === a2).toBe(false);
    expect(Z.eq(a1, a2)).toBe(true);
    a2.foo(2);
    expect(a1 === a2).toBe(false);
    expect(Z.eq(a1, a2)).toBe(false);
  });

  it('should fall back to using the == operator if the first object is not a Z.Object', function() {
    expect(Z.eq('foo', 'foo')).toBe(true);
    expect(Z.eq('foo', 'bar')).toBe(false);
    expect(Z.eq(9, 9)).toBe(true);
    expect(Z.eq(9, 10)).toBe(false);
    expect(Z.eq(null, 0)).toBe(false);
  });
});

}());
