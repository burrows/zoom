(function() {

if (!this.Z) { require('./helper'); }

describe('Z.Observable', function() {

describe('Z.Observable.prop', function() {
  var Person = Z.Object.extend(Z.Observable, function() {
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
      expect(p.firstName('Corey')).toBe('Corey');
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

  A = Z.Object.extend(Z.Observable, function() {
    this.prop('foo');
  });

  B = A.extend(Z.Observable, function() {
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

describe('Z.Observable KVC support:', function() {
  var Person = Z.Object.extend(Z.Observable, function() {
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

    it('should return the value', function() {
      var p = Person.create();
      expect(p.set('firstName', 'Bob')).toBe('Bob');
      expect(p.set('points', 9)).toBe(9);
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

    describe('for a cached property', function() {
      var Foo = Z.Object.extend(Z.Observable, function() {
        this.prop('a');
        this.prop('twicea', {
          cache: true,
          dependsOn: ['a'],
          get: function() { called++; return this.a() * 2; }
        });
      }), called;

      beforeEach(function() { called = 0; });

      it('should call the getter function to initially compute the value', function() {
        var f = Foo.create({a: 9});

        expect(f.twicea()).toBe(18);
        expect(called).toBe(1);
      });

      it('should return the cached value on subsequent gets after the first', function() {
        var f = Foo.create({a: 7});

        expect(f.twicea()).toBe(14);
        expect(called).toBe(1);
        expect(f.twicea()).toBe(14);
        expect(called).toBe(1);
        expect(f.get('twicea')).toBe(14);
        expect(called).toBe(1);
      });

      it('should clear the cached value when a dependent path changes', function() {
        var f = Foo.create({a: 3});

        expect(f.twicea()).toBe(6);
        expect(called).toBe(1);
        expect(f.twicea()).toBe(6);
        expect(called).toBe(1);
        f.a(5)
        expect(f.twicea()).toBe(10);
        expect(called).toBe(2);
        expect(f.get('twicea')).toBe(10);
        expect(called).toBe(2);
        f.set('a', 21);
        expect(f.twicea()).toBe(42);
        expect(called).toBe(3);
        expect(f.get('twicea')).toBe(42);
        expect(called).toBe(3);
      });
    });
  });

  describe('.getUnknownProperty', function() {
    var o;

    beforeEach(function() {
      o = Z.Object.extend(Z.Observable).create()
      o.def('foo', function() { return 'foo'; });
      o.bar = 'bar';
    });

    it('should return `null` if there is no raw property value with the given name', function() {
      expect(o.get('doesntExist')).toBeNull();
    });

    it('should return the raw property value if its not a function', function() {
      expect(o.get('bar')).toBe('bar');
    });

    it('should return the result of calling the raw property if it is a function', function() {
      expect(o.get('foo')).toBe('foo');
    });
  });

  describe('.setUnknownProperty', function() {
    var o;

    beforeEach(function() {
      o = Z.Object.extend(Z.Observable).create()
      o.def('foo', function(v) { this.__foo__ = v; });
    });

    it('should set a raw property of the given name', function() {
      o.set('bar', 9);
      expect(o.bar).toBe(9);
    });

    it('should call the function with the given value if the raw property is a function object', function() {
      o.set('foo', 7);
      expect(o.__foo__).toBe(7);
    });
  });

  describe('.set on a readonly property', function() {
    it('should throw an exception', function() {
      var o = Z.Object.extend(Z.Observable, function() {
        this.prop('x', {readonly: true});
      }).create();

      expect(function() {
        o.set('x', 19);
      }).toThrow("Z.Object.set: attempted to set readonly property `x` for " + (o.toString()));
    });
  });

  describe('with a key path:', function() {
    var A, B, C, a, b, c;

    A = Z.Object.extend(Z.Observable, function() {
      this.prop('b');
    });
    B = Z.Object.extend(Z.Observable, function() {
      this.prop('c');
    });
    C = Z.Object.extend(Z.Observable, function() {
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

  User = Z.Object.extend(Z.Observable, function() {
    this.prop('name');
    this.prop('address');
  });

  Address = Z.Object.extend(Z.Observable, function() {
    this.prop('number');
    this.prop('street');
  });

  describe('.on with a simple key', function() {
    beforeEach(function() { user = User.create({name: 'Joe'}); });

    it('should cause the given action to be invoked, bound to the observer, after the given key has changed', function() {
      var observer = {
        called: false,
        nameDidChange: function() { this.called = true; }
      };
      user.on('didChange:name', 'nameDidChange', {observer: observer});
      user.set('name', 'Bob');
      expect(observer.called).toBe(true);
    });

    it('should cause the given function to be invoked, bound to the observer, when the given key has changed', function() {
      var observer = {
        called: false,
        nameDidChange: function() { this.called = true; }
      };
      user.on('didChange:name', observer.nameDidChange, {observer: observer});
      user.set('name', 'Bob');
      expect(observer.called).toBe(true);
    });

    it('should cause the given handler to be invoked with the path that changed and an undefined data argument', function() {
      var handler = jasmine.createSpy();

      user.on('willChange:name', handler);
      user.on('didChange:name', handler);
      user.set('name', 'Bob');
      expect(handler.callCount).toBe(2);
      expect(handler).toHaveBeenCalledWith('willChange:name', undefined);
      expect(handler).toHaveBeenCalledWith('didChange:name', undefined);
    });

    it('should allow attaching multiple observers to the same key', function() {
      var handler1 = jasmine.createSpy(), handler2 = jasmine.createSpy();
      user.on('didChange:name', handler1);
      user.on('didChange:name', handler2);
      user.name('Sam');
      expect(handler1).toHaveBeenCalledWith('didChange:name', undefined);
      expect(handler2).toHaveBeenCalledWith('didChange:name', undefined);
    });

    it('should pass the object indicated by the context option in the handler as the third argument', function() {
      var handler = jasmine.createSpy();
      user.on('didChange:name', handler, {context: 'the-context'});
      user.set('name', 'Bob');
      expect(handler).toHaveBeenCalledWith('didChange:name', undefined, 'the-context');
    });

    it('should invoke a `willChange` handler before the property is actually changed', function() {
      var val = null, handler = function() { val = user.name(); };
      user.on('willChange:name', handler);
      user.set('name', 'Sam');
      expect(val).toBe('Joe');
    });

    it('should fire the handler immediately when  the `fire` option is set', function() {
      var handler = jasmine.createSpy();
      user.on('didChange:name', handler, {fire: true});
      expect(handler).toHaveBeenCalledWith('didChange:name', undefined);
    });

    it('should fire the observer immediately when the `fire` option is set and include the `context` when the `context` option is set', function() {
      var handler = jasmine.createSpy();
      user.on('didChange:name', handler, {fire: true, context: 'foo'});
      expect(handler).toHaveBeenCalledWith('didChange:name', undefined, 'foo');
    });

    it('should remove the observer after the first time it fires if the `once` option is set', function() {
      var handler = jasmine.createSpy();
      user.on('didChange:name', handler, {once: true});
      user.set('name', 'Ed');
      user.set('name', 'Bill');
      expect(handler.callCount).toBe(1);
    });
  });

  describe('.off with a simple key', function() {
    it('should prevent the handler from being notified of further changes', function() {
      var handler1 = jasmine.createSpy(),
          handler2 = jasmine.createSpy(),
          user     = User.create({name: 'Joe'});

      user.on('didChange:name', handler1);
      user.on('didChange:name', handler2);
      user.name('Mary');
      expect(handler1.callCount).toBe(1);
      expect(handler2.callCount).toBe(1);
      user.off('didChange:name', handler1);
      user.name('Susan');
      expect(handler1.callCount).toBe(1);
      expect(handler2.callCount).toBe(2);
    });

    it('should remove all handlers for the given event, handler, observer, and context', function() {
      var observer, user;
      user = User.create({name: 'Joe'});
      observer = {called: 0, action: function() { this.called++; }};
      user.on('didChange:name', 'action', {observer: observer, context: 1});
      user.on('didChange:name', 'action', {observer: observer, context: 1});
      user.on('didChange:name', 'action', {observer: observer, context: 2});
      user.name('Mary');
      expect(observer.called).toBe(3);
      user.off('didChange:name', 'action', {observer: observer, context: 1});
      user.name('Susan');
      expect(observer.called).toBe(4);
    });
  });

  describe('.on with a key path', function() {
    it('should trigger handlers when any segment in the path changes', function() {
      var observer = { called: 0, action: function() { this.called++; } },
          user = User.create({ address: Address.create({ street: 'main' }) });
      user.on('didChange:address.street', 'action', {observer: observer});
      expect(observer.called).toBe(0);
      user.get('address').set('street', 'north');
      expect(observer.called).toBe(1);
      user.set('address', Address.create());
      expect(observer.called).toBe(2);
      user.set('address.street', 'madison');
      expect(observer.called).toBe(3);
    });

    it('should still cause handlers to be triggered when some segments in the path do not yet exist when the observer is created', function() {
      var observer, user;
      observer = {called: 0, action: function() { this.called++; }};
      user = User.create();
      user.on('didChange:address.street', 'action', {observer: observer});
      expect(observer.called).toBe(0);
      user.set('address', Address.create());
      expect(observer.called).toBe(1);
      user.get('address').set('street', 'pine');
      expect(observer.called).toBe(2);
    });

    it('should cause a single handler invocation when multiple segments are set at once', function() {
      var observer = {called: 0, action: function() { this.called++; }},
          user     = User.create();

      user.on('didChange:address.street', 'action', {observer: observer});
      expect(observer.called).toBe(0);
      user.set('address', Address.create({street: 'chestnut'}));
      expect(observer.called).toBe(1);
    });

    it('should no longer trigger handlers when a property on an object that was once but is not longer part of the path changes', function() {
      var observer = {called: 0, action: function() { this.called++; }},
          user     = User.create(),
          address1 = Address.create({street: 'clark'}),
          address2 = Address.create({street: 'addison'});

      user.on('didChange:address.street', 'action', {observer: observer});
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

    it('should cause the handler to be invoked with the path that changed when any segment in the path has changed', function() {
      var handler = jasmine.createSpy(),
          user    = User.create({address: Address.create({ street: 'main'})});

      user.on('didChange:address.street', handler);
      user.set('address.street', 'walnut');
      expect(handler).toHaveBeenCalledWith('didChange:address.street', undefined);
    });

    it('should allow attaching multiple handlers to the same path', function() {
      var handler1 = jasmine.createSpy(),
          handler2 = jasmine.createSpy(),
          user     = User.create({address: Address.create({street: 'main'})});

      user.on('didChange:address.street', handler1);
      user.on('didChange:address.street', handler2);
      user.set('address', Address.create());
      expect(handler1.callCount).toBe(1);
      expect(handler2.callCount).toBe(1);
    });

    it('should pass the object indicated by the context option to the handler as the third argument', function() {
      var handler = jasmine.createSpy(), user;
      user = User.create({address: Address.create({street: 'main'})});
      user.on('didChange:address.street', handler, {context: 'the-context'});
      user.address().street('chestnut');
      expect(handler).toHaveBeenCalledWith('didChange:address.street', undefined, 'the-context');
    });

    it('should invoke a `willChange` handler before the path is acutally changed', function() {
      var val     = null,
          handler = function() { val = user.get('address.street'); };
          user    = User.create({address: Address.create({street: 'main'})});

      user.on('willChange:address.street', handler);
      user.set('address.street', 'lincoln');
      expect(val).toEqual('main');
    });

    it('should fire the observer immediately when  the `fire` option is set', function() {
      var handler = jasmine.createSpy(),
          user    = User.create({address: Address.create({street: 'main'})});

      user.on('didChange:address.street', handler, {fire: true});
      expect(handler).toHaveBeenCalledWith('didChange:address.street', undefined);
    });

    describe('with a key path ending in `*`', function() {
      it('should fire observers when any property on the object at the end of the key path changes', function() {
        var handler = jasmine.createSpy(),
            user    = User.create({address: Address.create({number: 123, street: 'main'})});

        user.on('didChange:address.*', handler);
        user.address().number(321);
        expect(handler).toHaveBeenCalledWith('didChange:address.*', undefined);
        user.address().street('pine');
        expect(handler).toHaveBeenCalledWith('didChange:address.*', undefined);
        expect(handler.callCount).toBe(2);
      });
    });

    describe('with a `*` event type', function() {
      it('should fire observers with both `willChange:` and `didChange:` events', function() {
        var handler = jasmine.createSpy(),
            user    = User.create({address: Address.create({number: 123, street: 'main'})});

        user.on('*:address.number', handler);
        user.address().number(321);
        expect(handler).toHaveBeenCalledWith('willChange:address.number', undefined);
        expect(handler).toHaveBeenCalledWith('didChange:address.number', undefined);
      });
    });
  });

  describe('.off with a key path', function() {
    it('should prevent the handler from being invoked upon further changes to any segment in the path', function() {
      var handler = jasmine.createSpy(),
          user    = User.create({address: Address.create({street: 'main'})});

      user.on('didChange:address.street', handler);
      expect(handler.callCount).toBe(0);
      user.set('address.street', 'first');
      expect(handler.callCount).toBe(1);
      user.off('didChange:address.street', handler);
      user.set('address.street', 'second');
      expect(handler.callCount).toBe(1);
      user.set('address', Address.create());
      expect(handler.callCount).toBe(1);
      user.set('address.street', 'third');
      expect(handler.callCount).toBe(1);
    });

    it('should not remove internal segment handlers for other path observers', function() {
      var handler1 = jasmine.createSpy(),
          handler2 = jasmine.createSpy(),
          user     = User.create({address: Address.create({number: 123, street: 'main'})});

      user.on('didChange:address.number', handler1);
      user.on('didChange:address.street', handler2);
      user.set('address.number', 321);
      user.set('address.street', 'maple');
      expect(handler1.callCount).toBe(1);
      expect(handler2.callCount).toBe(1);

      user.off('didChange:address.street', handler2);
      user.set('address', Address.create({number: 333, street: 'chestnut'}));
      expect(handler1.callCount).toBe(2);
      expect(handler2.callCount).toBe(1);
    });

    describe('with a key path ending in `*`', function() {
      it('should prevent handlers from being invoked when any property on the object at the end of the key path changes', function() {
        var handler = jasmine.createSpy(),
            user    = User.create({address: Address.create({number: 123, street: 'main'})});

        user.on('didChange:address.*', handler);
        user.address().number(321);
        expect(handler.callCount).toBe(1);
        user.address().street('pine');
        expect(handler.callCount).toBe(2);
        user.off('didChange:address.*', handler);
        user.address().number(222);
        expect(handler.callCount).toBe(2);
      });
    });
  });

  describe('.on with the `*` key', function() {
    it('should trigger handlers for any property that changes', function() {
      var handler = jasmine.createSpy(), u = User.create();

      u.on('didChange:*', handler);
      u.name('Homer');
      expect(handler).toHaveBeenCalledWith('didChange:name', undefined);
      u.address(Address.create({street: '123 Fake St.'}));
      expect(handler).toHaveBeenCalledWith('didChange:address', undefined);
    });

    it('should throw an exception when `*` is used in the middle of a key path', function() {
      var u = User.create();

      expect(function() {
        u.on('didChange:*.street', function() {});
      }).toThrow("Z.Observable.on: observing `*` anywhere other than at the end of a key path is not supported: '*.street'");
    });
  });

  describe('.off with the `*` key', function() {
    it('should stop triggering handlers for any property that changes', function() {
      var handler = jasmine.createSpy(), u = User.create();

      u.on('didChange:*', handler);
      u.name('Homer');
      expect(handler.callCount).toBe(1);
      u.off('didChange:*', handler);
      u.name('Marge');
      expect(handler.callCount).toBe(1);
    });
  });

  describe('.on with an unknown key', function() {
    it("should thrown an exception", function() {
      var o = Z.Object.extend(Z.Observable).create();

      expect(function() {
        o.on('didChange:foobar', function() {});
      }).toThrow("Z.Observable.on: undefined key `foobar` for " + (o.toString()));
    });
  });

  describe('.off with an unknown key', function() {
    it("should thrown an exception", function() {
      var o = Z.Object.extend(Z.Observable).create();

      expect(function() {
        o.off('didChange:foobar', function() {});
      }).toThrow("Z.Observable.off: undefined key `foobar` for " + (o.toString()));
    });
  });

  describe('removing a handler from another handler', function() {
    it('should not raise an exception when done before the property changes', function() {
      var u        = User.create({name: 'Ed'}),
          handler2 = function() {},
          handler1 = function() { this.off('didChange:name', handler2); };

      u.on('willChange:name', handler1);
      u.on('didChange:name', handler2);

      expect(function() { u.name('Bob'); }).not.toThrow();
    });

    it('should not raise an exception when done after the property changes', function() {
      var u        = User.create({name: 'Ed'}),
          handler2 = function() {},
          handler1 = function() { this.off('didChange:name', handler2); };

      u.on('didChange:name', handler1);
      u.on('didChange:name', handler2);

      expect(function() { u.name('Bob'); }).not.toThrow();
    });
  });

  describe('.setif', function() {
    it('should trigger handlers when the new value is different than the old value', function() {
      var u       = User.create({name: 'Bob'}),
          handler = jasmine.createSpy();

       u.on('didChange:name', handler);
       u.setif('name', 'Bill');
       expect(handler.callCount).toBe(1);
    });

    it('should not trigger handlers when the new value is identical to the old value', function() {
      var u       = User.create({name: 'Bob'}),
          handler = jasmine.createSpy();

       u.on('didChange:name', handler);
       u.setif('name', 'Bob');
       expect(handler.callCount).toBe(0);
    });

    it('should not trigger handlers when the new value is equal to the old value', function() {
      var u       = User.create({name: [1,2,3]}),
          handler = jasmine.createSpy();

       u.on('didChange:name', handler);
       u.setif('name', [1,2,3]);
       expect(handler.callCount).toBe(0);
    });

    it('should conditionally set values given as a native object', function() {
      var u = User.create({name: 'Bob', address: '123 Fake St.'}),
          handler = jasmine.createSpy();

      u.on('didChange:name', handler);
      u.on('didChange:address', handler);

      u.setif({name: 'Bill', address: '123 Fake St.'});

      expect(u.name()).toBe('Bill');
      expect(u.address()).toBe('123 Fake St.');
      expect(handler.callCount).toBe(1);
      expect(handler).toHaveBeenCalledWith('didChange:name', undefined);
    });
  });
});

describe('Z.Observable dependent properties:', function() {
  var Person, Occupation;

  Person = Z.Object.extend(Z.Observable, function() {
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

  Occupation = Z.Object.extend(Z.Observable, function() {
    this.prop('name');
  });

  it('should notify observers when any of the dependent keys change', function() {
    var p       = Person.create({first: 'Homer', last: 'Simpson'}),
        handler = jasmine.createSpy();

    p.on('didChange:full', handler);

    expect(handler.callCount).toBe(0);
    p.set('first', 'Bart');
    expect(handler.callCount).toBe(1);
    expect(handler).toHaveBeenCalledWith('didChange:full', undefined);
    p.set('last', 'Smith');
    expect(handler.callCount).toBe(2);
  });

  it('should notify observers when any of the dependent paths change', function() {
    var handler = jasmine.createSpy(), p;

    p = Person.create({
      first: 'Homer',
      last: 'Simpson',
      occupation: Occupation.create({ name: 'Safety Inspector' })
    });

    p.on('didChange:displayName', handler);
    expect(handler.callCount).toBe(0);
    p.set('occupation.name', 'Bus Driver');
    expect(handler.callCount).toBe(1);
    expect(handler).toHaveBeenCalledWith('didChange:displayName', undefined);
    p.set('occupation', Occupation.create({name: 'Astronaut'}));
    expect(handler.callCount).toBe(2);
  });

  it('should notify observers when dependent properties which in turn have dependent properties change', function() {
    var handler = jasmine.createSpy(), p;

    p = Person.create({
      first: 'Homer',
      last: 'Simpson',
      occupation: Occupation.create({ name: 'Safety Inspector' })
    });

    p.on('didChange:displayName', handler);

    expect(handler.callCount).toBe(0);
    p.set('first', 'Bart');
    expect(handler.callCount).toBe(1);
    expect(handler).toHaveBeenCalledWith('didChange:displayName', undefined);
  });
});

describe('Z.Observable.destroy', function() {
  var Address, Person;

  Address = Z.Object.extend(Z.Observable, function() {
    this.prop('number');
    this.prop('street');
  });

  Person = Z.Object.extend(Z.Observable, function() {
    this.prop('first');
    this.prop('last');
    this.prop('full', {
      readonly: true, dependsOn: ['first', 'last'],
      get: function() { return this.first() + ' ' + this.last(); }
    });
    this.prop('address');
  });

  it('should remove any existing observers', function() {
    var p = Person.create({first: 'Homer', last: 'Simpson'});

    p.on('didChange:first', function() {});

    expect(p.__z_on__).not.toEq({});
    p.destroy();
    expect(p.__z_on__).toEq({});
  });

  it('should remove any existing unknown property observers', function() {
    var a = Address.create({number: 123, street: 'Fake St.'}),
        p = Person.create({address: a});

    p.on('didChange:address.street', function() {});

    expect(p.__z_on__).not.toEq({});
    expect(a.__z_on__).not.toEq({});
    p.destroy();
    expect(p.__z_on__).toEq({});
    expect(a.__z_on__).toEq({});
  });
});

});
}());
