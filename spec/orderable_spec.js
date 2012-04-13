(function() {

var Z = this.Z || require('zoom'), Foo, fa, fb, fc;

Foo = Z.Object.extend(Z.Orderable, function() {
  this.prop('x');

  this.def('cmp', function(other) {
    if (!other || !other.isZObject || !other.isA(Foo)) { return false; }
    return Z.cmp(this.x(), other.x());
  });
});

fa = Foo.create({x: 1});
fb = Foo.create({x: 2});
fc = Foo.create({x: 1});

describe('Z.Orderable.lt', function() {
  it('should return true when the receiver is less than the given object and false otherwise', function() {
    expect(fa.lt(fb)).toBe(true);
    expect(fb.lt(fa)).toBe(false);
    expect(fa.lt(fc)).toBe(false);
  });
});

describe('Z.Orderable.lte', function() {
  it('should return true when the receiver is less than or equal to the given object and false otherwise', function() {
    expect(fa.lte(fb)).toBe(true);
    expect(fa.lte(fc)).toBe(true);
    expect(fb.lte(fa)).toBe(false);
  });
});

describe('Z.Orderable.gt', function() {
  it('should return true when the receiver is greater than the given object and false otherwise', function() {
    expect(fb.gt(fa)).toBe(true);
    expect(fa.gt(fb)).toBe(false);
    expect(fa.gt(fc)).toBe(false);
  });
});

describe('Z.Orderable.gt', function() {
  it('should return true when the receiver is greater than or equal to the given object and false otherwise', function() {
    expect(fb.gte(fa)).toBe(true);
    expect(fa.gte(fc)).toBe(true);
    expect(fa.gte(fb)).toBe(false);
  });
});

describe('Z.Orderable.max', function() {
  it('should return the receiver if it is greater than or equal to the given object and the object otherwise', function() {
    expect(fa.max(fc)).toBe(fa);
    expect(fb.max(fa)).toBe(fb);
    expect(fa.max(fb)).toBe(fb);
  });
});

describe('Z.Orderable.min', function() {
  it('should return the receiver if it is less than or equal to the given object and the object otherwise', function() {
    expect(fa.min(fc)).toBe(fa);
    expect(fb.min(fc)).toBe(fc);
    expect(fa.min(fb)).toBe(fa);
  });
});

describe('Z.cmp', function() {
  it('should call Z.Orderable#cmp if the first object is an orderable', function() {
    spyOn(fa, 'cmp');
    Z.cmp(fa, fb);
    expect(fa.cmp).toHaveBeenCalledWith(fb);
  });

  it('should fall back to using native js operators when first object is not orderable', function() {
    expect(Z.cmp(1, 2)).toBe(-1);
    expect(Z.cmp(2, 1)).toBe(1);
    expect(Z.cmp(2, 2)).toBe(0);
    expect(Z.cmp('foo', 'bar')).toBe(1);
    expect(Z.cmp('bar', 'foo')).toBe(-1);
    expect(Z.cmp('abc', 'abc')).toBe(0);
    expect(Z.cmp(new Date(2010, 5, 5), new Date(2011, 5, 5))).toBe(-1);
    expect(Z.cmp(new Date(2011, 5, 5), new Date(2010, 5, 5))).toBe(1);
    expect(Z.cmp(new Date(2011, 5, 5), new Date(2011, 5, 5))).toBe(0);
  });
});

}());
