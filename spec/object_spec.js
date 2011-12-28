(function() {

var Z = this.Z || require('zoom');

describe('Z.Object.extend', function() {
  it('should return an object whose prototype is the receiver', function() {
    var X1 = Z.Object.extend(), X2 = X1.extend();

    expect(Z.getPrototypeOf(X1)).toBe(Z.Object);
    expect(Z.getPrototypeOf(X2)).toBe(X1);
  });

  it('should assign an auto-incrementing id to each object created', function() {
    var X1 = Z.Object.extend(), X2 = Z.Object.extend(); X3 = Z.Object.extend();

    expect(typeof X1.objectId()).toEqual('number');
    expect(typeof X2.objectId()).toEqual('number');
    expect(typeof X3.objectId()).toEqual('number');
    expect(X1.objectId() < X2.objectId()).toBe(true);
    expect(X2.objectId() < X3.objectId()).toBe(true);
  });

  it('should not invoke the `initialize` method', function() {
    var called = false, X = Z.Object.extend(function() {
      this.def('initialize', function() { called = true; });
    }), Y;

    Y = X.extend();

    expect(called).toBe(false);
  });

  it("should invoke the given function in the context of the receiver when it is the last argument", function() {
    var context = null, X = Z.Object.extend(function() { context = this; });
    expect(context).toBe(X);
  });

  describe('when passed 1 or more Z.Module arguments', function() {
    var Mod1 = Z.Module.create(function() {
      this.def('foo', function() {});
    });

    var Mod2 = Z.Module.create(function() {
      this.def('bar', function() {});
    });

    it('should mixin the module into the prototype chain', function() {
      var p = Z.Object.extend(Mod1, Mod2);

      expect(p.respondTo('foo')).toBe(true);
      expect(p.respondTo('bar')).toBe(true);

      expect(p.ancestors()).toEqual([Mod2, Mod1, Z.Object]);
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
    var o1 = Z.Object.create(), o2 = Z.Object.create(); o3 = Z.Object.create();

    expect(typeof o1.objectId()).toEqual('number');
    expect(typeof o2.objectId()).toEqual('number');
    expect(typeof o3.objectId()).toEqual('number');
    expect(o1.objectId() < o2.objectId()).toBe(true);
    expect(o2.objectId() < o3.objectId()).toBe(true);
  });

  it('should invoke the `initialize` method', function() {
    var called = false, X = Z.Object.extend(), x;

    X.def('initialize', function() { called = true; });

    x = X.create();

    expect(called).toBe(true);
  });

  it('should pass all arguments to the `initialize` method', function() {
    var X = Z.Object.extend(), x, args;

    X.def('initialize', function() {
      args = Array.prototype.slice.call(arguments);
    });

    x = X.create(1,2,3);

    expect(args).toEqual([1,2,3]);
  });
});

describe('Z.Object.supr', function() {
  var Parent = Z.Object.extend(function() {
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

  var Child = Parent.extend(function() {
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

  var GrandChild = Child.extend(function() {
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

  var p, c, g;

  beforeEach(function() {
    p = Parent.create(), c = Child.create(), g = GrandChild.create();
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
    expect(Z.Object.respondTo('objectId')).toBe(true);
    expect(Z.Object.respondTo('respondTo')).toBe(true);
    expect(Z.Object.respondTo('someNonExistingMethod')).toBe(false);
  });
});

describe('Z.Object.ancestors', function() {
  var M1 = Z.Module.create(),
      M2 = Z.Module.create(),
      P1 = Z.Object.extend(),
      P2 = P1.extend(),
      P3 = P2.extend(M1, M2);

  it("should return an array containing the objects in the receiver's prototype chain up to Z.Object", function() {
    expect(Z.Object.ancestors()).toEqual([]);
    expect(Z.Object.create().ancestors()).toEqual([Z.Object]);

    expect(M1.ancestors()).toEqual([Z.Module, Z.Object]);
    expect(M2.ancestors()).toEqual([Z.Module, Z.Object]);
    expect(P1.ancestors()).toEqual([Z.Object]);
    expect(P2.ancestors()).toEqual([P1, Z.Object]);
    expect(P3.ancestors()).toEqual([M2, M1, P2, P1, Z.Object]);
    expect(P3.create().ancestors()).toEqual([P3, M2, M1, P2, P1, Z.Object]);
  });
});

describe('Z.Object.isA', function() {
  var M1 = Z.Module.create(),
      P1 = Z.Object.extend(),
      P2 = P1.extend(M1);

  it("should return true if the given object exists in the receiver's prototype chain", function() {
    var o = Z.Object.create(), p1 = P1.create(), p2 = P2.create();

    expect(Z.Object.isA(Z.Object)).toBe(false);
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

describe('Z.Object.name', function() {
  beforeEach(function() {
    Z.Stuff = Z.Object.extend();
    Z.root.MyNamespace = {};
    MyNamespace.Thing = Z.Object.extend();
  });

  afterEach(function() {
    delete Z.Stuff;
    delete Z.root.MyNamespace;
  });

  it('should return the name of the object for objects in the Z namespace', function() {
    expect(Z.Object.name()).toBe('Z.Object');
    expect(Z.Stuff.name()).toBe('Z.Stuff');
  });

  it('should return the name of the object for objects in the global namespace', function() {
    Z.root.Global = Z.Object.extend();
    expect(Global.name()).toBe('Global');
    delete Z.root.Global;
  });

  it('should return "(Unknown)" for objects not defined in a namespace', function() {
    var Something = Z.Object.extend();
    expect(Something.name()).toBe('(Unknown)');
  });

  it('should return "(Unknown)" for objects defined in a namespace other than Z but not registered', function() {
    expect(MyNamespace.Thing.name()).toBe('(Unknown)');
  });

  it('should return the name of the object for objects defined in a namespace other than Z that is registered', function() {
    Z.addNamespace(MyNamespace, 'MyNamespace');
    expect(MyNamespace.Thing.name()).toBe('MyNamespace.Thing');
    Z.removeNamespace(MyNamespace);
  });
});

describe('Z.Object.toString', function() {
  // FIXME: add test for property names
  it('should return a string containing the object name, object id and current property values', function() {
    var o;

    Z.root.Foo = Z.Object.extend();
    o = Z.Object.create();
    expect(o.toString()).toEqual("#<Z.Object:" + (o.objectId()) + ">");
  });
});

}());

