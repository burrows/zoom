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
    expect(function() { p.supr(); }).toThrow("Z.Object.supr: must be called from within a method: " + g.toString());
  });
});

}());

