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

    expect(typeof X1.objectId()).toEqual('number');
    expect(typeof X2.objectId()).toEqual('number');
    expect(typeof X3.objectId()).toEqual('number');
    expect(X1.objectId() < X2.objectId()).toBe(true);
    expect(X2.objectId() < X3.objectId()).toBe(true);
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

  describe('when passed 1 or more Z.Module arguments', function() {
    var Mod1, Mod2;

    Mod1 = Z.Module.create(function() {
      this.def('foo', function() {});
    });

    Mod2 = Z.Module.create(function() {
      this.def('bar', function() {});
    });

    it('should mixin the module into the prototype chain', function() {
      var p = Z.Object.extend(Mod1, Mod2);

      expect(p.respondTo('foo')).toBe(true);
      expect(p.respondTo('bar')).toBe(true);

      expect(p.ancestors()).toEq([p, Mod2, Mod1, Z.Object]);
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

    expect(typeof o1.objectId()).toEqual('number');
    expect(typeof o2.objectId()).toEqual('number');
    expect(typeof o3.objectId()).toEqual('number');
    expect(o1.objectId() < o2.objectId()).toBe(true);
    expect(o2.objectId() < o3.objectId()).toBe(true);
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
  var M1 = Z.Module.create(),
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
    this.prop('x');
    this.prop('y');
    this.prop('z');
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

    expect(o1.toString()).toEqual("#<Z.Object:" + (o1.objectId()) + '>');
    expect(o2.toString()).toMatch(/x: 1/);
    expect(o2.toString()).toMatch(/y: 2/);
    expect(o2.toString()).not.toMatch(/z: 3/);
  });

  it('should handle recursive objects', function() {
    var o = X.create({x: 9});
    o.y(o);

    expect(o.toString()).toMatch(/^#<\(Unknown\):\d+ /);
    expect(o.toString()).toMatch(/x: 9/);
    expect(o.toString()).toMatch(/y: #<\(Unknown\):\d+ \.\.\.>/);
  });
});

describe('Z.Object.property', function() {
  var Person = Z.Object.extend(function() {
    this.prop('firstName');
  });

  it('should define an instance method with the given name', function() {
    var p = Person.create();
    expect(typeof p.firstName).toEqual('function');
  });

  describe('generated instance method', function() {
    it('should set a private property when passed an argument', function() {
      var p = Person.create();
      expect(p.__firstName__).toBeUndefined();
      expect(p.firstName('Corey')).toBeNull();
      expect(p.__firstName__).toEqual('Corey');
    });

    it('should return the private property value when passed no arguments', function() {
      var p = Person.create();
      expect(p.firstName()).toBeNull();
      p.firstName('Nicole');
      expect(p.firstName()).toEqual('Nicole');
    });
  });
});

describe('Z.Object.hasProperty', function() {
  var A, B;

  A = Z.Object.extend(function() {
    this.prop('foo');
  });

  B = A.extend(function() {
    this.prop('bar');
  });

  it('should return `true` if a property with the given name exists on the object', function() {
    expect(A.hasProperty('foo')).toBe(true);
    expect(B.hasProperty('bar')).toBe(true);
  });

  it('should return `true` if a property with the given name exists on a super object', function() {
    expect(B.hasProperty('foo')).toBe(true);
  });

  it('should return `false` if a property with the given name does not exist on the object', function() {
    expect(A.hasProperty('idontexist')).toBe(false);
    expect(A.hasProperty('bar')).toBe(false);
  });
});

describe('Z.Object KVC support:', function() {
  var Person = Z.Object.extend(function() {
    this.prop('firstName');
    this.prop('points', {
      get: function() { return this._POINTS_; },
      set: function(v) { return this._POINTS_ = v; }
    });
  });

  describe('.set when given a key', function() {
    describe('for a property using the default setter', function() {
      it('should set a private property name on the receiver', function() {
        var p = Person.create();
        expect(p.__firstName__).toBeUndefined();
        p.set('firstName', 'Nicole');
        expect(p.__firstName__).toEqual('Nicole');
      });
    });

    describe('for a property using a custom setter', function() {
      it('should invoke the given setter function', function() {
        var p = Person.create();
        expect(p._POINTS_).toBeUndefined();
        expect(p.__points__).toBeUndefined();
        p.set('points', 18);
        expect(p._POINTS_).toEqual(18);
        expect(p.__points__).toBeUndefined();
      });
    });

    it('should return null', function() {
      var p = Person.create();
      expect(p.set('firstName', 'Bob')).toBeNull();
      expect(p.set('points', 9)).toBeNull();
    });

    it('should set all of the properties when given a hash', function() {
      var p = Person.create();
      p.set({ firstName: 'Joe', points: 12 });
      expect(p.get('firstName')).toBe('Joe');
      expect(p.get('points')).toBe(12);
    });

    it('should invoke setUnknownProperty, passing the name and value if a property with the given name does not exist', function() {
      var p = Person.create();
      spyOn(p, 'setUnknownProperty');
      p.set('doesntExist', 1);
      expect(p.setUnknownProperty).toHaveBeenCalledWith('doesntExist', 1);
    });
  });

  describe('.get when given a key', function() {
    describe('for a property using the default getter', function() {
      it('should get a private property name on the receiver', function() {
        var p = Person.create();
        p.set('firstName', 'George');
        expect(p.__firstName__).toEqual('George');
        expect(p.get('firstName')).toEqual('George');
      });
    });

    describe('for a property using a custom getter', function() {
      it('should invoke the given getter function', function() {
        var p = Person.create();
        p.set('points', 18);
        expect(p._POINTS_).toEqual(18);
        expect(p.get('points')).toEqual(18);
      });
    });

    describe("for a property that hasn't been set and was created with the `def` option", function() {
      it('should return the value of the `def` option', function() {
        var X = Z.Model.extend(function() {
          this.prop('foo', {def: 9});
          this.prop('bar');
        });

        expect(X.create().foo()).toBe(9);
        expect(X.create().bar()).toBeNull();
        expect(X.create({foo: 8, bar: 12}).foo()).toBe(8);
        expect(X.create({foo: 8, bar: 12}).bar()).toBe(12);
      });
    });

    it('should return all of the property values when given multiple property names', function() {
      var p = Person.create();
      p.set({ points: 18, firstName: 'Ed' });
      expect(p.get('points', 'firstName')).toEqual({ points: 18, firstName: 'Ed' });
    });

    it('should return all of the property values when given an array of property names', function() {
      var p = Person.create();
      p.set({ points: 19, firstName: 'Sue' });
      expect(p.get(['points', 'firstName'])).toEqual({ points: 19, firstName: 'Sue' });
    });

    it('should return all of the property values when given a Z.Array of property names', function() {
      var p = Person.create();
      p.set({ points: 19, firstName: 'Sue' });
      expect(p.get(Z.A('points', 'firstName'))).toEqual({ points: 19, firstName: 'Sue' });
    });

    it('should invoke getUnknownProperty, passing the name if a property with the given name does not exist', function() {
      var p = Person.create();
      spyOn(p, 'getUnknownProperty');
      p.get('doesntExist');
      expect(p.getUnknownProperty).toHaveBeenCalledWith('doesntExist');
    });
  });

  describe('.getUnknownProperty', function() {
    it('should throw an undefined key exception', function() {
      var o = Z.Object.create();
      expect(function() {
        o.get('blah');
      }).toThrow("Z.Object.get: undefined key `blah` for " + o.toString());
    });
  });

  describe('.setUnknownProperty', function() {
    it('should throw an undefined key exception', function() {
      var o = Z.Object.create();
      expect(function() {
        o.set('blah', 1);
      }).toThrow("Z.Object.set: undefined key `blah` for " + (o.toString()));
    });
  });

  describe('.set on a readonly property', function() {
    it('should throw an exception', function() {
      var o = Z.Object.create();
      expect(function() {
        o.set('objectId', 19);
      }).toThrow("Z.Object.set: attempted to set readonly property `objectId` for " + (o.toString()));
    });
  });

  describe('with a key path:', function() {
    var A, B, C, a, b, c;

    A = Z.Object.extend(function() {
      this.prop('b');
    });
    B = Z.Object.extend(function() {
      this.prop('c');
    });
    C = Z.Object.extend(function() {
      this.prop('num');
    });

    a = b = c = null;

    beforeEach(function() {
      a = A.create();
      b = B.create();
      c = C.create();
      a.b(b);
      b.c(c);
    });

    describe('.set', function() {
      it('should set the value for the property identified by the given key path', function() {
        expect(c.num()).toBeNull();
        expect(c.get('num')).toBeNull();
        a.set('b.c.num', 9);
        expect(c.num()).toBe(9);
        expect(c.get('num')).toBe(9);
      });

      it('should do nothing when some segment in the path yields a null or undefined value', function() {
        a.b(null);
        expect(function() { a.set('b.c.num', 9); }).not.toThrow();

        a.b(undefined);
        expect(function() { a.set('b.c.num', 9); }).not.toThrow();

        expect(c.num()).toBeNull();
        expect(c.get('num')).toBeNull();
      });
    });

    describe('.get', function() {
      it('should return the value for the derived property identified by the given key path', function() {
        c.set('num', 21);
        expect(a.get('b.c.num')).toBe(21);
      });

      it('should return null when some segment in the path yields a null or undefined value', function() {
        b.c(null);
        expect(a.get('b.c.num')).toBe(null);
        b.c(undefined);
        expect(a.get('b.c.num')).toBe(null);
      });
    });
  });
});

describe('Z.Object KVO support:', function() {
  var Address, User, user = null;

  User = Z.Object.extend(function() {
    this.prop('name');
    this.prop('address');
  });

  Address = Z.Object.extend(function() {
    this.prop('street');
  });

  describe('#observe with a simple key', function() {
    var user;

    beforeEach(function() { user = User.create({ name: 'Joe' }); });

    it('should cause the given action to be invoked, bound to the observer, after the given key has changed', function() {
      var observer = {
        called: false,
        nameDidChange: function() { this.called = true; }
      };
      user.observe('name', observer, 'nameDidChange');
      user.set('name', 'Bob');
      expect(observer.called).toBe(true);
    });

    it('should cause the given function to be invoked, bound to the observer, when the given key has changed', function() {
      var observer = {
        called: false,
        nameDidChange: function() { this.called = true; }
      };
      user.observe('name', observer, observer.nameDidChange);
      user.set('name', 'Bob');
      expect(observer.called).toBe(true);
    });

    it('should cause the given action to be invoked with a change notification object containing the path that changed and the observee when the given key has changed', function() {
      var observer = {
        notification: null,
        nameDidChange: function(n) { this.notification = n; }
      };

      user.observe('name', observer, 'nameDidChange');
      user.set('name', 'Bob');
      expect(observer.notification.type).toEqual('change');
      expect(observer.notification.path).toEqual('name');
      expect(observer.notification.observee).toBe(user);
    });

    it('should allow attaching multiple observers to the same key', function() {
      var observer1, observer2;
      observer1 = { called: false, action: function() { this.called = true; } };
      observer2 = { called: false, action: function() { this.called = true; } };
      user.observe('name', observer1, 'action');
      user.observe('name', observer2, 'action');
      user.name('Sam');
      expect(observer1.called).toBe(true);
      expect(observer2.called).toBe(true);
    });

    it('should pass the object indicated by the context option in the notification if it exists', function() {
      var observer = {
        notification: null,
        nameDidChange: function(n) { this.notification = n; }
      };
      user.observe('name', observer, 'nameDidChange', { context: 'the-context' });
      user.set('name', 'Bob');
      expect(observer.notification.context).toEqual('the-context');
    });

    it('should set an `previous` key in the notification that points to the previous value of the property if the previous option is set', function() {
      var observer = {
        notification: null,
        nameDidChange: function(n) { this.notification = n; }
      };
      user.observe('name', observer, 'nameDidChange', { previous: true });
      user.set('name', 'Sam');
      expect(observer.notification.previous).toEqual('Joe');
    });

    it('should set a `current` key in the notification that points to the current value of the property if the current option is set', function() {
      var observer = {
        notification: null,
        nameDidChange: function(n) { this.notification = n; }
      };
      user.observe('name', observer, 'nameDidChange', { current: true });
      user.set('name', 'George');
      expect(observer.notification.current).toEqual('George');
    });

    it('should set both `previous` and `current` keys when both options are set', function() {
      var observer = {
        notification: null,
        nameDidChange: function(n) { this.notification = n; }
      };
      user.observe('name', observer, 'nameDidChange', { previous: true, current: true });
      user.set('name', 'Ed');
      expect(observer.notification.previous).toEqual('Joe');
      expect(observer.notification.current).toEqual('Ed');
    });

    it('should fire the observer immediately when  the `fire` option is set', function() {
      var observer = {
        notification: null,
        nameDidChange: function(n) { this.notification = n; }
      };
      user.observe('name', observer, 'nameDidChange', { fire: true });
      expect(observer.notification).not.toBeNull();
      expect(observer.notification.path).toEqual('name');
      expect(observer.notification.observee).toBe(user);
    });

    it('should fire the observer immediately when the `fire` option is set and include the `current` key when the `current` option is set', function() {
      var observer = {
        notification: null,
        nameDidChange: function(n) { this.notification = n; }
      };
      user.observe('name', observer, 'nameDidChange', { fire: true, current: true });
      expect(observer.notification.path).toEqual('name');
      expect(observer.notification.current).toEqual('Joe');
    });

    it('should fire the observer immediately when the `fire` option is set and not include the `previous` key even when the `previous` option is set', function() {
      var observer = {
        notification: null,
        nameDidChange: function(n) { this.notification = n; }
      };
      user.observe('name', observer, 'nameDidChange', { fire: true, previous: true });
      expect(observer.notification.hasOwnProperty('previous')).toBe(false);
    });

    it('should invoke the action before the property change actually occurs when the `prior` option is set', function() {
      var observer = {
        notifications: [],
        nameDidChange: function(n) {
          n.currentVal = user.name();
          this.notifications.push(n);
        }
      };
      user.observe('name', observer, 'nameDidChange', { prior: true });
      user.set('name', 'Corey');
      expect(observer.notifications.length).toBe(2);
      expect(observer.notifications[0].currentVal).toEqual('Joe');
      expect(observer.notifications[0].isPrior).toBe(true);
      expect(observer.notifications[1].currentVal).toEqual('Corey');
      expect(observer.notifications[1].isPrior).toBeUndefined();
    });

    it('should include the `previous` key in the notification when notifying prior to a property change when the `previous` option is set', function() {
      var observer = {
        notifications: [],
        nameDidChange: function(n) { this.notifications.push(n); }
      };
      user.observe('name', observer, 'nameDidChange', { prior: true, previous: true });
      user.set('name', 'Corey');
      expect(observer.notifications.length).toBe(2);
      expect(observer.notifications[0].previous).toEqual('Joe');
      expect(observer.notifications[1].previous).toEqual('Joe');
    });

    it('should not include the `current` key in the notification when notifying prior to a property change when the `current` option is set', function() {
      var observer = {
        notifications: [],
        nameDidChange: function(n) { this.notifications.push(n); }
      };
      user.observe('name', observer, 'nameDidChange', { prior: true, current: true });
      user.set('name', 'Corey');
      expect(observer.notifications.length).toBe(2);
      expect(observer.notifications[0].hasOwnProperty('current')).toBe(false);
      expect(observer.notifications[1].current).toEqual('Corey');
    });
  });

  describe('#stopObserving with a simple key', function() {
    it('should prevent the registered observer from being notified of further changes', function() {
      var observer1, observer2, user;
      user = User.create({ name: 'Joe' });
      observer1 = { called: false, action: function() { this.called = true; } };
      observer2 = { called: false, action: function() { this.called = true; } };
      user.observe('name', observer1, 'action');
      user.observe('name', observer2, 'action');
      user.name('Mary');
      expect(observer1.called).toBe(true);
      expect(observer2.called).toBe(true);
      observer1.called = false;
      observer2.called = false;
      user.stopObserving('name', observer1, 'action');
      user.name('Susan');
      expect(observer1.called).toBe(false);
      expect(observer2.called).toBe(true);
    });

    it('should remove all observers that have the given path, observer, action, and context', function() {
      var observer, user;
      user = User.create({ name: 'Joe' });
      observer = { called: 0, action: function() { this.called++; } };
      user.observe('name', observer, 'action', {context: 1});
      user.observe('name', observer, 'action', {context: 1});
      user.observe('name', observer, 'action', {context: 2});
      user.name('Mary');
      expect(observer.called).toBe(3);
      user.stopObserving('name', observer, 'action', {context: 1});
      user.name('Susan');
      expect(observer.called).toBe(4);
    });
  });

  describe('#observe with a key path', function() {
    it('should cause a notification to be delivered to the observer when any segment in the path changes', function() {
      var observer = { called: 0, action: function() { this.called++; } },
          user = User.create({ address: Address.create({ street: 'main' }) });
      user.observe('address.street', observer, 'action');
      expect(observer.called).toBe(0);
      user.get('address').set('street', 'north');
      expect(observer.called).toBe(1);
      user.set('address', Address.create());
      expect(observer.called).toBe(2);
      user.set('address.street', 'madison');
      expect(observer.called).toBe(3);
    });

    it('should still cause a notifications to be delivered when some segments in the path do not yet exist when the observer is created', function() {
      var observer, user;
      observer = { called: 0, action: function() { this.called++; } };
      user = User.create();
      user.observe('address.street', observer, 'action');
      expect(observer.called).toBe(0);
      user.set('address', Address.create());
      expect(observer.called).toBe(1);
      user.get('address').set('street', 'pine');
      expect(observer.called).toBe(2);
    });

    it('should cause a single notification to be sent when multiple segments are set', function() {
      var observer = { called: 0, action: function() { this.called++; } },
          user     = User.create();

      user.observe('address.street', observer, 'action');
      expect(observer.called).toBe(0);
      user.set('address', Address.create({ street: 'chestnut' }));
      expect(observer.called).toBe(1);
    });

    it('should no longer trigger notifications when a property on an object that was once but is not longer part of the path changes', function() {
      var observer = { called: 0, action: function() { this.called++; } },
          user     = User.create(),
          address1 = Address.create({ street: 'clark' }),
          address2 = Address.create({ street: 'addison' });

      user.observe('address.street', observer, 'action');
      expect(observer.called).toBe(0);
      user.set('address', address1);
      expect(observer.called).toBe(1);
      address1.set('street', 'waveland');
      expect(observer.called).toBe(2);
      user.set('address', address2);
      expect(observer.called).toBe(3);
      address1.set('street', 'sheffield');
      expect(observer.called).toBe(3);
      address2.set('street', 'grace');
      expect(observer.called).toBe(4);
    });

    it('should cause the given action to be invoked with a change notification object containing the path that changed and the observee when any segment in the path has changed', function() {
      var observer = { notification: null, action: function(n) { this.notification = n; } },
          user     = User.create({ address: Address.create({ street: 'main' }) });

      user.observe('address.street', observer, 'action');
      user.set('address.street', 'walnut');
      expect(observer.notification.path).toEqual('address.street');
      expect(observer.notification.observee).toBe(user);
    });

    it('should allow attaching multiple observers to the same path', function() {
      var observer1 = { called: false, action: function() { this.called = true; } },
          observer2 = { called: false, action: function() { this.called = true; } },
          user      = User.create({ address: Address.create({ street: 'main' }) });

      user.observe('address.street', observer1, 'action');
      user.observe('address.street', observer2, 'action');
      user.set('address', Address.create());
      expect(observer1.called).toBe(true);
      expect(observer2.called).toBe(true);
    });

    it('should pass the object indicated by the context option in the notification if it exists', function() {
      var observer, user;
      observer = { notification: null, action: function(n) { this.notification = n; } };
      user = User.create({ address: Address.create({ street: 'main' }) });
      user.observe('address.street', observer, 'action', { context: 'the-context' });
      user.address().street('chestnut');
      expect(observer.notification.context).toEqual('the-context');
    });

    it('should set an `previous` key in the notification that points to the previous value of the path if the previous option is set', function() {
      var observer = { notification: null, action: function(n) { this.notification = n; } };
          user     = User.create({ address: Address.create({ street: 'main' }) });

      user.observe('address.street', observer, 'action', { previous: true });
      user.set('address.street', 'lincoln');
      expect(observer.notification.previous).toEqual('main');
    });

    it('should set a `current` key in the notification that points to the current value of the property if the current option is set', function() {
      var observer = { notification: null, action: function(n) { this.notification = n; } },
          user     = User.create({ address: Address.create({ street: 'main' }) });

      user.observe('address.street', observer, 'action', { "current": true });
      user.set('address.street', 'lincoln');
      expect(observer.notification.current).toEqual('lincoln');
    });

    it('should set both `previous` and `current` keys when both options are set', function() {
      var observer = { notification: null, action: function(n) { this.notification = n; } },
          user     = User.create({ address: Address.create({ street: 'main' }) });

      user.observe('address.street', observer, 'action', { current: true, previous: true });
      user.set('address.street', 'lincoln');
      expect(observer.notification.previous).toEqual('main');
      expect(observer.notification.current).toEqual('lincoln');
    });

    it('should fire the observer immediately when  the `fire` option is set', function() {
      var observer = { notification: null,action: function(n) { this.notification = n; } },
          user     = User.create({ address: Address.create({ street: 'main' }) });

      user.observe('address.street', observer, 'action', { fire: true });
      expect(observer.notification).not.toBeNull();
      expect(observer.notification.path).toEqual('address.street');
      expect(observer.notification.observee).toBe(user);
    });

    it('should fire the observer immediately when the `fire` option is set and include the `current` key when the `current` option is set', function() {
      var observer = { notification: null, action: function(n) { this.notification = n; } },
          user     = User.create({address: Address.create({ street: 'main' }) });

      user.observe('address.street', observer, 'action', { fire: true, current: true });
      expect(observer.notification.path).toEqual('address.street');
      expect(observer.notification.current).toEqual('main');
    });

    it('should fire the observer immediately when the `fire` option is set and not include the `previous` key even when the `previous` option is set', function() {
      var observer = { notification: null, action: function(n) { this.notification = n; } },
          user = User.create({ address: Address.create({ street: 'main' }) });

      user.observe('address.street', observer, 'action', { fire: true, previous: true });
      expect(observer.notification.path).toEqual('address.street');
      expect(observer.notification.hasOwnProperty('previous')).toBe(false);
    });

    it('should invoke the action before the property change actually occurs when the `prior` option is set', function() {
      var user     = User.create({ address: Address.create({ street: 'main' }) }),
          observer = {
        notifications: [],
        action: function(n) {
          n.currentVal = user.get('address.street');
          this.notifications.push(n);
        }
      };

      user.observe('address.street', observer, 'action', { prior: true });
      user.set('address.street', 'marshfield');
      expect(observer.notifications.length).toBe(2);
      expect(observer.notifications[0].currentVal).toEqual('main');
      expect(observer.notifications[0].isPrior).toBe(true);
      expect(observer.notifications[1].currentVal).toEqual('marshfield');
      expect(observer.notifications[1].isPrior).toBeUndefined();
    });

    it('should include the `previous` key in the notification when notifying prior to a property change when the `previous` option is set', function() {
      var user = User.create({ address: Address.create({ street: 'main' }) }),
          observer = {
        notifications: [],
        action: function(n) { this.notifications.push(n); }
      };

      user.observe('address.street', observer, 'action', { prior: true, previous: true });
      user.set('address.street', 'marshfield');
      expect(observer.notifications.length).toBe(2);
      expect(observer.notifications[0].previous).toEqual('main');
      expect(observer.notifications[1].previous).toEqual('main');
    });

    it('should not include the `current` key in the notification when notifying prior to a property change when the `current` option is set', function() {
      var user     = User.create({ address: Address.create({ street: 'main' }) }),
          observer = {
        notifications: [],
        action: function(n) { this.notifications.push(n); }
      };

      user.observe('address.street', observer, 'action', { prior: true, current: true });
      user.set('address.street', 'marshfield');
      expect(observer.notifications.length).toBe(2);
      expect(observer.notifications[0].hasOwnProperty('current')).toBe(false);
      expect(observer.notifications[1].current).toEqual('marshfield');
    });
  });

  describe('#stopObserving with a key path', function() {
    it('should prevent the registered observer from being notified of further changes to any segment in the path', function() {
      var observer = { called: 0, action: function() { this.called++; } },
          user = User.create({ address: Address.create({ street: 'main' }) });

      user.observe('address.street', observer, 'action');
      expect(observer.called).toBe(0);
      user.set('address.street', 'first');
      expect(observer.called).toBe(1);
      user.stopObserving('address.street', observer, 'action');
      user.set('address.street', 'second');
      expect(observer.called).toBe(1);
      user.set('address', Address.create());
      expect(observer.called).toBe(1);
      user.set('address.street', 'third');
      expect(observer.called).toBe(1);
    });
  });

  describe('#observe with an unknown key', function() {
    it("should thrown an exception", function() {
      var observer = { action: function() {} },
          o        = Z.Object.create();

      expect(function() {
        o.observe('foobar', observer, 'action');
      }).toThrow("Z.Object.registerObserver: undefined key `foobar` for " + (o.toString()));
    });
  });

  describe('#stopObserving with an unknown key', function() {
    it("should thrown an exception", function() {
      var observer = { action: function() {} },
          o        = Z.Object.create();

      expect(function() {
        o.stopObserving('foobar', observer, 'action');
      }).toThrow("Z.Object.deregisterObserver: undefined key `foobar` for " + (o.toString()));
    });
  });
});

describe('Z.Object dependent properties:', function() {
  var Person, Occupation;

  Person = Z.Object.extend(function() {
    this.prop('first');
    this.prop('last');
    this.prop('occupation');
    this.prop('full', {
      dependsOn: ['first', 'last'],
      get: function() { return this.first() + ' ' + this.last(); }
    });
    this.prop('displayName', {
      dependsOn: ['full', 'occupation.name'],
      get: function() {
        return Z.fmt("%@ (%@)", this.full(), this.get('occupation.name'));
      }
    });
  });

  Occupation = Z.Object.extend(function() {
    this.prop('name');
  });

  it('should notify observers when any of the dependent keys change', function() {
    var p        = Person.create({ first: 'Homer', last: 'Simpson' }),
        observer = {
      notifications: [],
      action: function(n) { this.notifications.push(n); }
    };

    p.observe('full', observer, 'action', { previous: true, current: true });

    expect(observer.notifications.length).toBe(0);
    p.set('first', 'Bart');
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].path).toBe('full');
    expect(observer.notifications[0].previous).toBe('Homer Simpson');
    expect(observer.notifications[0].current).toBe('Bart Simpson');
    p.set('last', 'Smith');
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].path).toBe('full');
    expect(observer.notifications[1].previous).toBe('Bart Simpson');
    expect(observer.notifications[1].current).toBe('Bart Smith');
  });

  it('should notify observers when any of the dependent paths change', function() {
    var observer, p;
    observer = {
      notifications: [],
      action: function(n) {
        return this.notifications.push(n);
      }
    };
    p = Person.create({
      first: 'Homer',
      last: 'Simpson',
      occupation: Occupation.create({ name: 'Safety Inspector' })
    });

    p.observe('displayName', observer, 'action', { previous: true, current: true });
    expect(observer.notifications.length).toBe(0);
    p.set('occupation.name', 'Bus Driver');
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].path).toBe('displayName');
    expect(observer.notifications[0].previous).toBe('Homer Simpson (Safety Inspector)');
    expect(observer.notifications[0].current).toBe('Homer Simpson (Bus Driver)');
    p.set('occupation', Occupation.create({ name: 'Astronaut' }));
    expect(observer.notifications.length).toBe(2);
    expect(observer.notifications[1].path).toBe('displayName');
    expect(observer.notifications[1].previous).toBe('Homer Simpson (Bus Driver)');
    expect(observer.notifications[1].current).toBe('Homer Simpson (Astronaut)');
  });

  it('should notify observers when dependent properties which in turn have dependent properties change', function() {
    var observer, p;
    observer = {
      notifications: [],
      action: function(n) { this.notifications.push(n); }
    };
    p = Person.create({
      first: 'Homer',
      last: 'Simpson',
      occupation: Occupation.create({ name: 'Safety Inspector' })
    });

    p.observe('displayName', observer, 'action', { previous: true, current: true });

    expect(observer.notifications.length).toBe(0);
    p.set('first', 'Bart');
    expect(observer.notifications.length).toBe(1);
    expect(observer.notifications[0].path).toBe('displayName');
    expect(observer.notifications[0].previous).toBe('Homer Simpson (Safety Inspector)');
    expect(observer.notifications[0].current).toBe('Bart Simpson (Safety Inspector)');
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

