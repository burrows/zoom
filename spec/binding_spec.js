(function() {

if (!this.Z) { require('./helper'); }

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

describe('Z.Binding', function() {
  describe('.init', function() {
    var p1, p2;

    beforeEach(function() {
      p1 = Person.create();
      p2 = Person.create();
    });

    it('should add observers to each path', function() {
      var n1 = p1.__z_on__['didChange:first'].length,
          n2 = p2.__z_on__['didChange:last'].length;

      Z.Binding.create(p1, 'first', p2, 'last');
      expect(p1.__z_on__['didChange:first'].length).toBe(n1 + 1);
      expect(p2.__z_on__['didChange:last'].length).toBe(n2 + 1);
    });

    it('should only add observers to the from object with the `oneway` option', function() {
      var n1 = p1.__z_on__['didChange:first'].length,
          n2 = p2.__z_on__['didChange:last'].length;

      Z.Binding.create(p1, 'first', p2, 'last', {oneway: true});
      expect(p1.__z_on__['didChange:first'].length).toBe(n1);
      expect(p2.__z_on__['didChange:last'].length).toBe(n2 + 1);
    });
  });

  describe('.flush', function() {
    describe('with a freshly made binding', function() {
      it('should sync the existing value of the from side to the to side', function() {
        var p1 = Person.create(),
            p2 = Person.create({first: 'Joe', last: 'Blow'});

        Z.Binding.create(p1, 'first', p2, 'first');

        expect(p1.first()).toBeNull();
        expect(p2.first()).toBe('Joe');
        Z.Binding.flush();
        expect(p1.first()).toBe('Joe');
        expect(p2.first()).toBe('Joe');
      });
    });

    describe('with a binding whose from path has changed', function() {
      it('should sync the change to the to side', function() {
        var p1 = Person.create(), p2 = Person.create();

        Z.Binding.create(p1, 'first', p2, 'first');
        Z.Binding.flush();

        expect(p1.first()).toBeNull();
        expect(p2.first()).toBeNull();

        p2.first('Bob');

        expect(p1.first()).toBeNull();
        expect(p2.first()).toBe('Bob');

        Z.Binding.flush();
        expect(p1.first()).toBe('Bob');
        expect(p2.first()).toBe('Bob');
      });
    });

    describe('with a binding whose to path has changed', function() {
      it('should sync the change to the from side', function() {
        var p1 = Person.create(), p2 = Person.create();

        Z.Binding.create(p1, 'first', p2, 'first');
        Z.Binding.flush();

        expect(p1.first()).toBeNull();
        expect(p2.first()).toBeNull();

        p1.first('Ed');

        expect(p1.first()).toBe('Ed');
        expect(p2.first()).toBeNull();

        Z.Binding.flush();
        expect(p1.first()).toBe('Ed');
        expect(p2.first()).toBe('Ed');
      });

      it('should not sync the change to the from side when the binding was created with the `oneway` option', function() {
        var p1 = Person.create(), p2 = Person.create();

        Z.Binding.create(p1, 'first', p2, 'first', {oneway: true});
        Z.Binding.flush();

        expect(p1.first()).toBeNull();
        expect(p2.first()).toBeNull();

        p1.first('Ed');

        expect(p1.first()).toBe('Ed');
        expect(p2.first()).toBeNull();

        Z.Binding.flush();
        expect(p1.first()).toBe('Ed');
        expect(p2.first()).toBeNull();
      });
    });

    describe('with a from key path', function() {
      it('should sync any change to the key path', function() {
        var a = Address.create(),
            p = Person.create({address: Address.create({street: 'main'})});

        Z.Binding.create(a, 'street', p, 'address.street');

        expect(a.street()).toBeNull();

        Z.Binding.flush();
        expect(a.street()).toBe('main');

        p.set('address.street', 'madison');
        expect(a.street()).toBe('main');
        Z.Binding.flush();
        expect(a.street()).toBe('madison');

        p.set('address', Address.create({street: 'jackson'}));
        expect(a.street()).toBe('madison');
        Z.Binding.flush();
        expect(a.street()).toBe('jackson');

        a.street('pine');
        expect(p.address().street()).toBe('jackson');
        Z.Binding.flush();
        expect(p.address().street()).toBe('pine');
      });
    });

    describe('with a to key path', function() {
      it('should have no effect when the to key path is not fully created', function() {
        var p1 = Person.create(),
            p2 = Person.create({address: Address.create({number: 1})});

        Z.Binding.create(p1, 'address.street', p2, 'address.street');
        Z.Binding.flush();

        expect(p1.address()).toBeNull();
        p2.set('address.number', 2);
        Z.Binding.flush();
        expect(p1.address()).toBeNull();
      });

      it('should sync any change to the key path', function() {
        var p1 = Person.create({address: Address.create()}),
            p2 = Person.create({address: Address.create({number: 1})});

        Z.Binding.create(p1, 'address.number', p2, 'address.number');
        Z.Binding.flush();

        expect(p1.get('address.number')).toBe(1)
        expect(p2.get('address.number')).toBe(1)

        p2.set('address.number', 2);
        Z.Binding.flush()
        expect(p1.get('address.number')).toBe(2)
        expect(p2.get('address.number')).toBe(2)

        p1.set('address.number', 3);
        Z.Binding.flush();
        expect(p1.get('address.number')).toBe(3)
        expect(p2.get('address.number')).toBe(3)
      });
    });

    describe('with a stale binding with a `transform` option', function() {
      it('should pass the changed value to the transform function and set the value returned by the transform function', function() {
        var t = function(v) { return v ? v.toUpperCase() : v; },
            p1 = Person.create(),
            p2 = Person.create({first: 'Bob'});

        Z.Binding.create(p1, 'first', p2, 'first', {transform: t});
        Z.Binding.flush();

        expect(p1.first()).toBe('BOB');
        expect(p2.first()).toBe('Bob');

        p2.first('joe');
        Z.Binding.flush();
        expect(p1.first()).toBe('JOE');
        expect(p2.first()).toBe('joe');
      });

      it('should pass the side that triggered the binding to update to the transform function', function() {
        var src = null,
            t   = function(v, s) { src = s; return v ? v.toUpperCase() : v; },
            p1  = Person.create(),
            p2  = Person.create({first: 'Bob'});

        Z.Binding.create(p1, 'first', p2, 'first', {transform: t});
        Z.Binding.flush();

        expect(src).toBe('from');

        p1.first('joe');
        Z.Binding.flush();
        expect(src).toBe('to');

        p2.first('bill');
        Z.Binding.flush();
        expect(src).toBe('from');
      });
    });

    describe('with chained bindings', function() {
      it('should flush changes all the way through the chain', function() {
        var p1 = Person.create({first: 'Bill'}),
            p2 = Person.create(),
            p3 = Person.create();

        Z.Binding.create(p3, 'first', p2, 'first');
        Z.Binding.create(p2, 'first', p1, 'first');
        Z.Binding.flush();

        expect(p1.first()).toBe('Bill');
        expect(p2.first()).toBe('Bill');
        expect(p3.first()).toBe('Bill');

        p1.set('first', 'Ed');
        Z.Binding.flush();

        expect(p1.first()).toBe('Ed');
        expect(p2.first()).toBe('Ed');
        expect(p3.first()).toBe('Ed');

        p3.first('George');
        Z.Binding.flush();

        expect(p1.first()).toBe('George');
        expect(p2.first()).toBe('George');
        expect(p3.first()).toBe('George');

        p2.first('Sam');
        Z.Binding.flush();
        expect(p1.first()).toBe('Sam');
        expect(p2.first()).toBe('Sam');
        expect(p3.first()).toBe('Sam');
      });
    });
  });

  describe('.deactivate', function() {
    it('should remove path observers from both sides', function() {
      var p1 = Person.create(),
          p2 = Person.create(),
          n1 = p1.__z_on__['didChange:first'].length,
          n2 = p2.__z_on__['didChange:last'].length,
          b  = Z.Binding.create(p1, 'first', p2, 'last');

      expect(p1.__z_on__['didChange:first'].length).toBe(n1 + 1);
      expect(p2.__z_on__['didChange:last'].length).toBe(n2 + 1);

      b.deactivate();

      expect(p1.__z_on__['didChange:first'].length).toBe(n1);
      expect(p2.__z_on__['didChange:last'].length).toBe(n2);
    });
  });

  describe('.activate', function() {
    it('should re-add path observers to both sides', function() {
      var p1 = Person.create(),
          p2 = Person.create(),
          n1 = p1.__z_on__['didChange:first'].length,
          n2 = p2.__z_on__['didChange:last'].length,
          b  = Z.Binding.create(p1, 'first', p2, 'last');

      expect(p1.__z_on__['didChange:first'].length).toBe(n1 + 1);
      expect(p2.__z_on__['didChange:last'].length).toBe(n2 + 1);

      b.deactivate();

      expect(p1.__z_on__['didChange:first'].length).toBe(n1);
      expect(p2.__z_on__['didChange:last'].length).toBe(n2);

      b.activate();

      expect(p1.__z_on__['didChange:first'].length).toBe(n1 + 1);
      expect(p2.__z_on__['didChange:last'].length).toBe(n2 + 1);
    });
  });
});

}());

