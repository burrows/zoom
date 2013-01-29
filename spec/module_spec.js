(function() {

if (!this.Z) { require('./helper'); }

Test.ModA = Z.Module.extend(function() {
  this.foo = 1;
  this.def('bar', function() { return 'Test.ModA.bar'; });
});

Test.ModB = Z.Module.extend(function() {
});

Test.ModC = Z.Module.extend(Test.ModA, Test.ModB, function() {
});

describe('Z.Module.init', function() {
  it('should throw an exception when called', function() {
    expect(function() {
      Z.Module.create();
    }).toThrow('Z.Module.create should never be called.');
  });
});

describe('Z.Module.ancestors', function() {
  describe('for modules with no other mixed in modules', function() {
    it('should an array containing the module, `Z.Module`, and `Z.Object`', function() {
      expect(Test.ModA.ancestors()).toEq([Test.ModA, Z.Module, Z.Object]);
      expect(Test.ModB.ancestors()).toEq([Test.ModB, Z.Module, Z.Object]);
    });
  });

  describe('for modules that have other modules mixed in', function() {
    it('should an array containing the module, its mixed in modules, `Z.Module`, and `Z.Object`', function() {
      expect(Test.ModC.ancestors()).toEq([Test.ModC, Test.ModB, Test.ModA, Z.Module, Z.Object]);
    });
  });
});

describe('Z.Module.mixin', function() {
  it('should create a new object with the given prototype', function() {
    var o = Z.Object.create();
    expect(Z.getPrototypeOf(Test.ModA.mixin(o))).toBe(o);
  });

  it('should set the `__z_module__` property to the receiver', function() {
    var mixin = Test.ModA.mixin(Z.Object);
    expect(mixin.__z_module__).toBe(Test.ModA);
  });

  it('should copy own properties to the mixin object', function() {
    var mixin = Test.ModA.mixin(Z.Object);
    expect(mixin.foo).toBe(1);
    expect(mixin.bar()).toBe('Test.ModA.bar');
  });

  it('should not copy the `__z_objectId__` property', function() {
    var mixin = Test.ModA.mixin(Z.Object);
    expect(mixin.hasOwnProperty('__z_objectId__')).toBe(false);
  });
});

}());
