(function() {

if (!this.Z) { require('./helper'); }

describe('Z.Object.extend', function() {
  it('should return an object whose prototype is the receiver', function() {
    var X1 = Z.Object.extend(), X2 = X1.extend();

    expect(Z.getPrototypeOf(X1)).toBe(Z.Object);
    expect(Z.getPrototypeOf(X2)).toBe(X1);
  });

  it('should assign an auto-incrementing id to each object created', function() {
    var X1 = Z.Object.extend(), X2 = Z.Object.extend(), X3 = Z.Object.extend();

    expect(typeof X1.objectId).toEqual('number');
    expect(typeof X2.objectId).toEqual('number');
    expect(typeof X3.objectId).toEqual('number');
    expect(X1.objectId < X2.objectId).toBe(true);
    expect(X2.objectId < X3.objectId).toBe(true);
  });

  it('should set the isType raw property to `true`', function() {
    expect(Z.Object.extend().isType).toBe(true);
  });

  it('should not invoke the `init` method', function() {
    var called = false, X = Z.Object.extend(function() {
      this.def('init', function() { called = true; });
    }), Y;

    Y = X.extend();

    expect(called).toBe(false);
  });

  it("should invoke the given function in the context of the receiver when it is the last argument", function() {
    var context = null, X = Z.Object.extend(function() { context = this; });
    expect(context).toBe(X);
  });

  it('should invoke the `extended` method on the receiver before executing the body', function() {
    var calls = [], X, Y;

    X = Z.Object.extend(function() {
      this.def('extended', function(proto) {
        calls.push(this);
      });
    });

    Y = X.extend(function() {
      calls.push(this);
    });

    expect(calls).toEq([X, Y]);
  });

  describe('when passed one or more `Z.Module` arguments', function() {
    Test.Mod1 = Z.Module.extend(function() {
      this.foo = 'Mod1.foo';
      this.blah = 'Mod1.blah'
    });

    Test.Mod2 = Z.Module.extend(function() {
      this.bar = 'Mod2.bar';
      this.blah = 'Mod2.blah'
    });

    Test.Mod3 = Z.Module.extend(Test.Mod1, Test.Mod2, function() {
      this.baz = 'Mod3.baz';
    });

    it('should mixin the module into the prototype chain', function() {
      var p = Z.Object.extend(Test.Mod1, Test.Mod2);

      expect(p.ancestors()).toEq([p, Test.Mod2, Test.Mod1, Z.Object]);
      expect(p.foo).toBe('Mod1.foo');
      expect(p.bar).toBe('Mod2.bar');
    });

    it('should mixin any modules that the given modules mixin to themselves', function() {
      var p = Z.Object.extend(Test.Mod3);

      expect(p.ancestors()).toEq([p, Test.Mod3, Test.Mod2, Test.Mod1, Z.Object]);
      expect(p.foo).toBe('Mod1.foo');
      expect(p.bar).toBe('Mod2.bar');
      expect(p.baz).toBe('Mod3.baz');
    });

    it('should not mixin any modules more than once', function() {
      var p1 = Z.Object.extend(Test.Mod1, Test.Mod3),
          p2 = Z.Object.extend(Test.Mod3, Test.Mod2);

      expect(p1.ancestors()).toEq([p1, Test.Mod3, Test.Mod2, Test.Mod1, Z.Object]);
      expect(p2.ancestors()).toEq([p2, Test.Mod3, Test.Mod2, Test.Mod1, Z.Object]);
    });

    it('should include modules listed later lower in the prototype chain', function() {
      var p1 = Z.Object.extend(Test.Mod1, Test.Mod2),
          p2 = Z.Object.extend(Test.Mod2, Test.Mod1);

      expect(p1.blah).toBe('Mod2.blah');
      expect(p2.blah).toBe('Mod1.blah');
    });
  });
});

describe('Z.Object.create', function() {
  it('should return an object whose prototype is the receiver', function() {
    var o1 = Z.Object.create(), o2 = o1.create();
    expect(Z.getPrototypeOf(o1)).toBe(Z.Object);
    expect(Z.getPrototypeOf(o2)).toBe(o1);
  });

  it('should assign an auto-incrementing id to each object created', function() {
    var o1 = Z.Object.create(), o2 = Z.Object.create(), o3 = Z.Object.create();

    expect(typeof o1.objectId).toEqual('number');
    expect(typeof o2.objectId).toEqual('number');
    expect(typeof o3.objectId).toEqual('number');
    expect(o1.objectId < o2.objectId).toBe(true);
    expect(o2.objectId < o3.objectId).toBe(true);
  });

  it('should set the `isType` raw property to `false`', function() {
    expect(Z.Object.create().isType).toBe(false);
  });

  it('should invoke the `init` method', function() {
    var called = false, X = Z.Object.extend(), x;

    X.def('init', function() { called = true; });

    x = X.create();

    expect(called).toBe(true);
  });

  it('should pass all arguments to the `init` method', function() {
    var X = Z.Object.extend(), x, args;

    X.def('init', function() {
      args = Array.prototype.slice.call(arguments);
    });

    x = X.create(1,2,3);

    expect(args).toEqual([1,2,3]);
  });
});

describe('Z.Object.type', function() {
  it('should throw an exception when called on a type object', function() {
    expect(function() {
      Z.Object.type();
    }).toThrow('Z.Object.type: must be called on a concrete object');

    expect(function() {
      Z.Object.extend().type();
    }).toThrow('Z.Object.type: must be called on a concrete object');
  });

  it('should return the type object when called on objects created with `Z.Object.create`', function() {
    var Parent = Z.Object.extend(), Child = Parent.extend();

    expect(Parent.create().type()).toBe(Parent);
    expect(Child.create().type()).toBe(Child);
  });

  it('should return the first object in the prototype chain that has `isType` set to `true`', function() {
    var X = Z.Object.extend();

    expect(X.create().type()).toBe(X);
    expect(X.create().create().type()).toBe(X);
    expect(X.create().create().create().type()).toBe(X);
  });
});

describe('Z.Object.supr', function() {
  var Parent, Child, GrandChild, p, c, g;

  Parent = Z.Object.extend(function() {
    this.def('foo', function() {
      return ['Parent.foo'];
    });

    this.def('bar', function() {
      return this;
    });

    this.def('baz', function() {
      return ['Parent.baz'];
    });

    this.def('quux', function() {
      return Array.prototype.slice.call(arguments);
    });
  });

  Child = Parent.extend(function() {
    this.def('foo', function() {
      return this.supr().concat('Child.foo');
    });

    this.def('bar', function() {
      return this.supr();
    });

    this.def('quux', function() {
      return this.supr('foo', 'bar');
    });
  });

  GrandChild = Child.extend(function() {
    this.def('foo', function() {
      return this.supr().concat('GrandChild.foo');
    });

    this.def('baz', function() {
      return this.supr().concat('GrandChild.baz');
    });

    this.def('nosuper', function() {
      return this.supr();
    });
  });

  beforeEach(function() {
    p = Parent.create(); c = Child.create(); g = GrandChild.create();
  });

  it('should call the next instance of the method in the prototype chain', function() {
    expect(p.foo()).toEqual(['Parent.foo']);
    expect(c.foo()).toEqual(['Parent.foo', 'Child.foo']);
    expect(g.foo()).toEqual(['Parent.foo', 'Child.foo', 'GrandChild.foo']);
  });

  it('should call the super method with the receiver as the context', function() {
    expect(p.bar()).toBe(p);
    expect(c.bar()).toBe(c);
    expect(g.bar()).toBe(g);
  });

  it("should skip over prototypes in the chain that don't implement the method", function() {
    expect(p.baz()).toEqual(['Parent.baz']);
    expect(c.baz()).toEqual(['Parent.baz']);
    expect(g.baz()).toEqual(['Parent.baz', 'GrandChild.baz']);
  });

  it('should forward its arguments to the actual method', function() {
    expect(p.quux(1,2,3)).toEqual([1,2,3]);
    expect(c.quux()).toEqual(['foo', 'bar']);
  });

  it('should throw an exception when a super method does not exist', function() {
    expect(function() { g.nosuper(); }).toThrow("Z.Object.supr: no super method `nosuper` found for " + g.toString());
  });

  it('should throw an exception when called from outside a method', function() {
    expect(function() { p.supr(); }).toThrow("Z.Object.supr: must be called from within a method: " + p.toString());
  });
});

describe('Z.Object.respondTo', function() {
  it('should return true if a method by the given name exists on the object and false otherwise', function() {
    expect(Z.Object.respondTo('extend')).toBe(true);
    expect(Z.Object.respondTo('create')).toBe(true);
    expect(Z.Object.respondTo('ancestors')).toBe(true);
    expect(Z.Object.respondTo('respondTo')).toBe(true);
    expect(Z.Object.respondTo('someNonExistingMethod')).toBe(false);
  });
});

describe('Z.Object.ancestors', function() {
  var M1 = Z.Module.extend(),
      M2 = Z.Module.extend(),
      P1 = Z.Object.extend(),
      P2 = P1.extend(),
      P3 = P2.extend(M1, M2);

  it("should return an array containing the objects in the receiver's prototype chain up to Z.Object", function() {
    var o = Z.Object.create();

    expect(Z.Object.ancestors()).toEq([Z.Object]);
    expect(o.ancestors()).toEq([o, Z.Object]);
    expect(M1.ancestors()).toEq([M1, Z.Module, Z.Object]);
    expect(M2.ancestors()).toEq([M2, Z.Module, Z.Object]);
    expect(P1.ancestors()).toEq([P1, Z.Object]);
    expect(P2.ancestors()).toEq([P2, P1, Z.Object]);
    expect(P3.ancestors()).toEq([P3, M2, M1, P2, P1, Z.Object]);
  });
});

describe('Z.Object.isA', function() {
  var M1 = Z.Module.extend(),
      P1 = Z.Object.extend(),
      P2 = P1.extend(M1);

  it("should return true if the given object exists in the receiver's prototype chain", function() {
    var o = Z.Object.create(), p1 = P1.create(), p2 = P2.create();

    expect(Z.Object.isA(Z.Object)).toBe(true);
    expect(o.isA(Z.Object)).toBe(true);
    expect(o.isA(P1)).toBe(false);
    expect(o.isA(P2)).toBe(false);
    expect(o.isA(M1)).toBe(false);

    expect(p1.isA(Z.Object)).toBe(true);
    expect(p1.isA(P1)).toBe(true);
    expect(p1.isA(P2)).toBe(false);
    expect(p1.isA(M1)).toBe(false);

    expect(p2.isA(Z.Object)).toBe(true);
    expect(p2.isA(P1)).toBe(true);
    expect(p2.isA(P2)).toBe(true);
    expect(p2.isA(M1)).toBe(true);
  });
});

describe('Z.Object.typeName', function() {
  beforeEach(function() {
    Z.Stuff = Z.Object.extend();
    Z.global.MyNamespace = {};
    Z.global.MyNamespace.Thing = Z.Object.extend();
  });

  afterEach(function() {
    Z.del(Z, 'Stuff');
    Z.del(Z.global, 'MyNamespace');
  });

  it('should return the name of the object for objects in the Z namespace', function() {
    expect(Z.Object.typeName()).toBe('Z.Object');
    expect(Z.Stuff.typeName()).toBe('Z.Stuff');
  });

  it('should return "(Unknown)" for objects not defined in a namespace', function() {
    var Something = Z.Object.extend();
    expect(Something.typeName()).toBe('(Unknown)');
  });

  it('should return "(Unknown)" for objects defined in a namespace other than Z but not registered', function() {
    expect(Z.global.MyNamespace.Thing.typeName()).toBe('(Unknown)');
  });

  it('should return the name of the object for objects defined in a namespace other than Z that is registered', function() {
    Z.addNamespace(Z.global.MyNamespace, 'MyNamespace');
    expect(Z.global.MyNamespace.Thing.typeName()).toBe('MyNamespace.Thing');
    Z.removeNamespace(Z.global.MyNamespace);
  });

  it("should return the name of the object's type when called on a concrete object", function() {
    expect(Z.Object.create().typeName()).toBe('Z.Object');
    expect(Z.A().typeName()).toBe('Z.Array');
    expect(Z.H().typeName()).toBe('Z.Hash');
  });
});

describe('Z.Object.toString', function() {
  var X = Z.Object.extend(function() {
    this.x = 1
    this.def('y', function() { return 2; });
    this.z = 3;
    this.def('toStringProperties', function() { return ['x', 'y']; });
  });

  it('should return the type name when called on a type object', function() {
    expect(Z.Object.toString()).toBe('Z.Object');
    expect(Z.Array.toString()).toBe('Z.Array');
    expect(Z.Hash.toString()).toBe('Z.Hash');
    expect(Z.Model.toString()).toBe('Z.Model');
    expect(X.toString()).toBe('(Unknown)');
  });

  it('should return a string containing the type name, object id and property values indicated by `toStringProperties`', function() {
    var o1 = Z.Object.create(), o2 = X.create({x: 1, y: 2, z: 3});

    expect(o1.toString()).toEqual("#<Z.Object:" + (o1.objectId) + '>');
    expect(o2.toString()).toMatch(/x: 1/);
    expect(o2.toString()).toMatch(/y: 2/);
    expect(o2.toString()).not.toMatch(/z: 3/);
  });

  it('should handle recursive objects', function() {
    var o = X.create();
    o.x = o;

    expect(o.toString()).toMatch(/^#<\(Unknown\):\d+ /);
    expect(o.toString()).toMatch(/x: #<\(Unknown\):\d+ \.\.\.>/);
    expect(o.toString()).toMatch(/y: 2/);
  });
});

describe('Z.Object.hash', function() {
  it('should return a number', function() {
    expect(typeof Z.Object.create().hash()).toBe('number');
  });

  it('should return different values for different object', function() {
    expect(Z.Object.create().hash()).not.toBe(Z.Object.create().hash());
  });
});

}());

