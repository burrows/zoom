(function() {

var Z = this.Z || require('zoom'), TestMod;

TestMod = Z.Module.create(function() {
  this.def('foo', function() {});
  this.def('bar', function() {});
  this.property('baz');
});

describe('Z.Module.createMixin', function() {
  it('should return an object with the given object as its prototype', function() {
    var o = Z.Object.create();
    expect(Object.getPrototypeOf(TestMod.createMixin(o))).toBe(o);
  });

  it('should copy all methods to the mixin object', function() {
    var mixin = TestMod.createMixin(Z.Object);
    expect(mixin.respondTo('foo')).toBe(true);
    expect(mixin.respondTo('bar')).toBe(true);
  });

  it('should copy all properties to the mixin object', function() {
    var mixin = TestMod.createMixin(Z.Object);
    expect(mixin.hasProperty('baz')).toBe(true);
  });
});

describe('Z.Module.def', function() {
  it('should define the method on all of its mixin objects', function() {
    var mixin1 = TestMod.createMixin(Z.Object),
        mixin2 = TestMod.createMixin(Z.Object);

    expect(mixin1.respondTo('quux')).toBe(false);
    expect(mixin2.respondTo('quux')).toBe(false);

    TestMod.open(function() {
      this.def('quux', function() {});
    });

    expect(mixin1.respondTo('quux')).toBe(true);
    expect(mixin2.respondTo('quux')).toBe(true);
  });
});

describe('Z.Module.property', function() {
  it('should define the property on all of its mixin objects', function() {
    var mixin1 = TestMod.createMixin(Z.Object),
        mixin2 = TestMod.createMixin(Z.Object);

    expect(mixin1.hasProperty('quux')).toBe(false);
    expect(mixin2.hasProperty('quux')).toBe(false);

    TestMod.open(function() {
      this.property('quux');
    });

    expect(mixin1.hasProperty('quux')).toBe(true);
    expect(mixin2.hasProperty('quux')).toBe(true);
  });
});

}());
