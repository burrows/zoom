(function() {

if (!this.Z) { require('./helper'); }

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
    this.prop('street');
  });

  describe('.observe with a simple key', function() {
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

    it('should fire the observer immediately when the `fire` option is set and include the `context` when the `context` option is set', function() {
      var observer = {
        notification: null,
        nameDidChange: function(n) { this.notification = n; }
      };
      user.observe('name', observer, 'nameDidChange', { fire: true, context: 'foo' });
      expect(observer.notification.context).toBe('foo');
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

    it('should remove the observer after the first time it fires if the `once` option is set', function() {
      var observer = {
        notifications: [],
        nameDidChange: function(n) { this.notifications.push(n); }
      };
      user.observe('name', observer, 'nameDidChange', { once: true });
      user.set('name', 'Ed');
      user.set('name', 'Bill');
      expect(observer.notifications.length).toBe(1);
    });
  });

  describe('.stopObserving with a simple key', function() {
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

  describe('.observe with a key path', function() {
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

  describe('.stopObserving with a key path', function() {
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

  describe('.observe with the `*` key', function() {
    it('should trigger notifications for any property that changes', function() {
      var notifications = [],
          observer = { action: function(n) { notifications.push(n); } },
          u = User.create();

      u.observe('*', observer, 'action');
      u.name('Homer');
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('change');
      expect(notifications[0].path).toBe('name');
      u.address(Address.create({street: '123 Fake St.'}));
      expect(notifications.length).toBe(2);
      expect(notifications[1].type).toBe('change');
      expect(notifications[1].path).toBe('address');
    });

    it('should throw an exception when `*` is used in the middle of a key path', function() {
      var u = User.create();

      expect(function() {
        u.observe('*.street', {}, 'action');
      }).toThrow("Z.Object.registerObserver: observing `*` in the middle of a property path is not supported: '*.street'");
    });
  });

  describe('.stopObserving with the `*` key', function() {
    it('should stop triggering notifications for any property that changes', function() {
      var notifications = [],
          observer = { action: function(n) { notifications.push(n); } },
          u = User.create();

      u.observe('*', observer, 'action');
      u.name('Homer');
      expect(notifications.length).toBe(1);
      u.stopObserving('*', observer, 'action');
      u.name('Marge');
      expect(notifications.length).toBe(1);
    });
  });

  describe('.observe with an unknown key', function() {
    it("should thrown an exception", function() {
      var observer = { action: function() {} },
          o        = Z.Object.extend(Z.Observable).create();

      expect(function() {
        o.observe('foobar', observer, 'action');
      }).toThrow("Z.Object.registerObserver: undefined key `foobar` for " + (o.toString()));
    });
  });

  describe('.stopObserving with an unknown key', function() {
    it("should thrown an exception", function() {
      var observer = { action: function() {} },
          o        = Z.Object.extend(Z.Observable).create();

      expect(function() {
        o.stopObserving('foobar', observer, 'action');
      }).toThrow("Z.Object.deregisterObserver: undefined key `foobar` for " + (o.toString()));
    });
  });

  describe('removing an observer from another observer', function() {
    it('should not raise an exception when done before the property changes', function() {
      var u   = User.create({name: 'Ed'}),
          cb2 = function() {},
          cb1 = function() { this.stopObserving('name', this, cb2); };

      u.observe('name', u, cb1, {prior: true});
      u.observe('name', u, cb2);

      expect(function() { u.name('Bob'); }).not.toThrow();
    });

    it('should not raise an exception when done after the property changes', function() {
      var u   = User.create({name: 'Ed'}),
          cb2 = function() {},
          cb1 = function() { this.stopObserving('name', this, cb2); };

      u.observe('name', u, cb1);
      u.observe('name', u, cb2);

      expect(function() { u.name('Bob'); }).not.toThrow();
    });
  });

  describe('.setif', function() {
    it('should trigger notifications when the new value is different than the old value', function() {
      var u         = User.create({name: 'Bob'}),
          triggered = 0,
          observer  = {action: function() { triggered++; }};

       u.observe('name', observer, 'action');
       u.setif('name', 'Bill');
       expect(triggered).toBe(1);
    });

    it('should not trigger notifications when the new value is identical to the old value', function() {
      var u         = User.create({name: 'Bob'}),
          triggered = 0,
          observer  = {action: function() { triggered++; }};

       u.observe('name', observer, 'action');
       u.setif('name', 'Bob');
       expect(triggered).toBe(0);
    });

    it('should not trigger notifications when the new value is equal to the old value', function() {
      var u         = User.create({name: [1,2,3]}),
          triggered = 0,
          observer  = {action: function() { triggered++; }};

       u.observe('name', observer, 'action');
       u.setif('name', [1,2,3]);
       expect(triggered).toBe(0);
    });

    it('should conditionally set values given as a native object', function() {
      var u = User.create({name: 'Bob', address: '123 Fake St.'}),
          notifications = [],
          observer = function(n) { notifications.push(n); };

      u.observe('name', null, observer);
      u.observe('address', null, observer);

      u.setif({name: 'Bill', address: '123 Fake St.'});

      expect(u.name()).toBe('Bill');
      expect(u.address()).toBe('123 Fake St.');
      expect(notifications.length).toBe(1);
      expect(notifications[0].path).toBe('name');
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

describe('Z.Observeable.destroy', function() {
  Person = Z.Object.extend(Z.Observable, function() {
    this.prop('first');
    this.prop('last');
    this.prop('full', {
      readonly: true, dependsOn: ['first', 'last'],
      get: function() { return this.first() + ' ' + this.last(); }
    });
  });

  it('should remove any existing observers', function() {
    var p = Person.create({first: 'Homer', last: 'Simpson'}),
        observer = function() {};

    p.observe('first', null, observer);

    expect(p.__z_registrations__['first'].length).toBe(2);
    expect(p.__z_registrations__['last'].length).toBe(1);
    p.destroy();
    expect(p.__z_registrations__['first'].length).toBe(0);
    expect(p.__z_registrations__['last'].length).toBe(0);
  });
});

}());
