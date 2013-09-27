(function() {

if (!this.Z) { require('./helper'); }

var Foo, Bar, f, b, funcHandler1, funcHandler2;

Foo = Z.Object.extend(Z.Emitter, function() {
  this.def('methHandler1', function() {});
  this.def('methHandler2', function() {});
});

Bar = Z.Object.extend(Z.Emitter, function() {
  this.def('methHandler1', function() {});
});

describe('Z.Emitter', function() {
  beforeEach(function() {
    f = Foo.create();
    b = Bar.create();

    funcHandler1 = jasmine.createSpy();
    funcHandler2 = jasmine.createSpy();

    spyOn(f, 'methHandler1');
    spyOn(f, 'methHandler2');

    spyOn(b, 'methHandler1');
  });

  describe('.on', function() {
    describe('with a string handler, no `observer` option, and the `fire` option set', function() {
      it('should invoke the method indicated by the string handler on the receiver', function() {
        f.on('change', 'methHandler1', {fire: true});
        expect(f.methHandler1).toHaveBeenCalledWith({event: 'change'});
      });
    });

    describe('with a string handler, an `observer` option, and the `fire` option set', function() {
      it('should invoke the method indicated by the string handler on the `observer` object', function() {
        f.on('change', 'methHandler1', {observer: b, fire: true});
        expect(f.methHandler1).not.toHaveBeenCalled()
        expect(b.methHandler1).toHaveBeenCalledWith({event: 'change'})
      });
    });

    describe('with a function handler, no `observer` option, and the `fire` option set', function() {
      it('should invoke the function with the receiver as the context', function() {
        var context = null, handler = function() { context = this; };

        f.on('change', handler, {fire: true});
        expect(context).toBe(f);
      });
    });

    describe('with a function handler, an `observer` option, and the `fire` option set', function() {
      it('should invoke the function with the `observer` object as the context', function() {
        var context = null, handler = function() { context = this; };

        f.on('change', handler, {observer: b, fire: true});
        expect(context).toBe(b);
      });
    });
  });

  describe('.off', function() {
    describe('with an event and handler', function() {
      beforeEach(function() {
        f.on('event1', funcHandler1);
        f.on('event1', 'methHandler1');
      });

      it('should remove all registrations for the exact event and handler', function() {
        f.emit('event1');
        expect(funcHandler1.callCount).toBe(1);
        expect(f.methHandler1.callCount).toBe(1);

        f.off('event1', funcHandler1);
        f.emit('event1');
        expect(funcHandler1.callCount).toBe(1);
        expect(f.methHandler1.callCount).toBe(2);

        f.off('event1', 'methHandler1');
        f.emit('event1');
        expect(funcHandler1.callCount).toBe(1);
        expect(f.methHandler1.callCount).toBe(2);
      });
    });

    describe('with just an event', function() {
      beforeEach(function() {
        f.on('event1', funcHandler1);
        f.on('event1', 'methHandler1');
      });

      it('should remove all registrations that match the event, regardless of the handler', function() {
        f.emit('event1');
        expect(funcHandler1.callCount).toBe(1);
        expect(f.methHandler1.callCount).toBe(1);

        f.off('event1');
        f.emit('event1');
        expect(funcHandler1.callCount).toBe(1);
        expect(f.methHandler1.callCount).toBe(1);
      });
    });

    describe('with an event and a handler', function() {
      beforeEach(function() {
        f.on('event1', 'methHandler1');
        f.on('event1', 'methHandler2');
      });

      it('should remove the registrations that match both the event and handler', function() {
        f.emit('event1');
        expect(f.methHandler1.callCount).toBe(1);
        expect(f.methHandler2.callCount).toBe(1);

        f.off('event1', 'methHandler2');
        f.emit('event1');
        expect(f.methHandler1.callCount).toBe(2);
        expect(f.methHandler2.callCount).toBe(1);
      });
    });

    describe('with an event, a handler, and an observer option', function() {
      var a, b;

      beforeEach(function() {
        a = Z.Object.create();
        b = Z.Object.create();

        f.on('event1', funcHandler1, {observer: a});
        f.on('event1', funcHandler1, {observer: b});
      });

      it('should remove the registrations that match the event, handler, and observer', function() {
        f.emit('event1');
        expect(funcHandler1.callCount).toBe(2);

        f.off('event1', funcHandler1, {observer: a});
        f.emit('event1');
        expect(funcHandler1.callCount).toBe(3);
      });
    });
  });

  describe('.emit', function() {
    describe('with a registration created with a string handler and no `observer` option', function() {
      it('should invoke the method indicated by the string handler on the receiver', function() {
        f.on('change', 'methHandler1');
        f.emit('change');
        expect(f.methHandler1).toHaveBeenCalledWith({event: 'change'});
      });
    });

    describe('with a registration created with a string handler and an `observer` option', function() {
      it('should invoke the method indicated by the string handler on the `observer` object', function() {
        f.on('change', 'methHandler1', {observer: b});
        f.emit('change');
        expect(f.methHandler1).not.toHaveBeenCalled()
        expect(b.methHandler1).toHaveBeenCalledWith({event: 'change'});
      });
    });

    describe('with a registration created with a function handler and no `observer` option', function() {
      it('should invoke the function in the context of the receiver', function() {
        var context = null, handler = function() { context = this; };

        f.on('change', handler);
        f.emit('change');
        expect(context).toBe(f);
      });
    });

    describe('with a registration created with a function handler and an `observer` option', function() {
      it('should invoke the handler function in the context of the `observer` object', function() {
        var context = null, handler = function() { context = this; };

        f.on('change', handler, {observer: b});
        f.emit('change');
        expect(context).toBe(b);
      });
    });

    describe('with a registration created with the `once` option', function() {
      it('should remove the registration so that the handler is no longer invoked on subsequent events', function() {
        f.on('change', 'methHandler1', {once: true});
        f.emit('change');
        expect(f.methHandler1.callCount).toBe(1);
        f.emit('change');
        expect(f.methHandler1.callCount).toBe(1);
      });
    });

    describe('with non-namespaced events', function() {
      it('should trigger registrations that match the event name exactly', function() {
        f.on('foo', 'methHandler1');
        f.emit('foo');
        expect(f.methHandler1).toHaveBeenCalledWith({event: 'foo'});
      });

      it("should trigger '*' registrations", function() {
        f.on('*', 'methHandler1');
        f.emit('foo');
        expect(f.methHandler1).toHaveBeenCalledWith({event: 'foo'});
      });

      it('should not trigger registrations for other events', function() {
        f.on('bar', 'methHandler1');
        f.emit('foo');
        expect(f.methHandler1).not.toHaveBeenCalled();
      });

      it('should not trigger registrations for a namespace', function() {
        f.on('foo:bar', 'methHandler1');
        f.emit('foo');
        expect(f.methHandler1).not.toHaveBeenCalled();
      });
    });

    describe('with namespaced events', function() {
      it('should trigger registrations that match the event exactly', function() {
        f.on('foo:bar', 'methHandler1');
        f.emit('foo:bar');
        expect(f.methHandler1).toHaveBeenCalledWith({event: 'foo:bar'});
      })

      it("should trigger registrations that match the type and have a namespace of '*'", function() {
        f.on('foo:*', 'methHandler1');
        f.emit('foo:bar');
        expect(f.methHandler1).toHaveBeenCalledWith({event: 'foo:bar'});
      });

      it("should trigger registrations that have a type of '*' and match the namespace exactly", function() {
        f.on('*:bar', 'methHandler1');
        f.emit('foo:bar');
        expect(f.methHandler1).toHaveBeenCalledWith({event: 'foo:bar'});
      });

      it("should trigger registrations that have a type of '*' and a namespace of '*'", function() {
        f.on('*:*', 'methHandler1');
        f.emit('foo:bar');
        expect(f.methHandler1).toHaveBeenCalledWith({event: 'foo:bar'});
      });

      it("should trigger '*' registrations", function() {
        f.on('*', 'methHandler1');
        f.emit('foo:bar');
        expect(f.methHandler1).toHaveBeenCalledWith({event: 'foo:bar'});
      });

      it('should not trigger registrations where just the type matches', function() {
        f.on('foo:quux', 'methHandler1');
        f.emit('foo:bar');
        expect(f.methHandler1).not.toHaveBeenCalled();
      });

      it('should not trigger registrations where just the namespace matches', function() {
        f.on('abc:bar', 'methHandler1');
        f.emit('foo:bar');
        expect(f.methHandler1).not.toHaveBeenCalled();
      });

      it('should not trigger registrations for just the event type', function() {
        f.on('foo', 'methHandler1');
        f.emit('foo:bar');
        expect(f.methHandler1).not.toHaveBeenCalled();
      });
    });

    it('should return the receiver', function() {
      expect(f.emit('change')).toBe(f);
    });
  });
});

}());

