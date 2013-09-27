(function() {

if (!this.Z) { require('./helper'); }

var Foo, f, b;

Foo = Z.Object.extend(Z.Emitter, function() {
  this.def('handler', function() {});
});

Bar = Z.Object.extend(Z.Emitter, function() {
  this.def('handler', function() {});
});

describe('Z.Emitter', function() {
  beforeEach(function() {
    f = Foo.create();
    b = Bar.create();
  });

  describe('.on', function() {
    describe('with a string handler, no `observer` option, and the `fire` option set', function() {
      it('should invoke the method indicated by the string handler on the receiver', function() {
        spyOn(f, 'handler');
        f.on('change', 'handler', {fire: true});
        expect(f.handler).toHaveBeenCalledWith('change');
      });
    });

    describe('with a string handler, an `observer` option, and the `fire` option set', function() {
      it('should invoke the method indicated by the string handler on the `observer` object', function() {
        spyOn(f, 'handler')
        spyOn(b, 'handler')
        f.on('change', 'handler', {observer: b, fire: true});
        expect(f.handler).not.toHaveBeenCalled()
        expect(b.handler).toHaveBeenCalledWith('change')
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
    var Foo, f, funcHandler1, funcHandler2;

    Foo = Z.Object.extend(Z.Emitter, function() {
      this.def('methHandler1', function() {console.log('methHandler1')});
      this.def('methHandler2', function() {console.log('methHandler2')});
    });

    beforeEach(function() {
      f = Foo.create();

      funcHandler1 = jasmine.createSpy();
      funcHandler2 = jasmine.createSpy();
      spyOn(f, 'methHandler1');
      spyOn(f, 'methHandler2');
    });

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
        spyOn(f, 'handler')
        f.on('change', 'handler');
        f.emit('change');
        expect(f.handler).toHaveBeenCalledWith('change');
      });
    });

    describe('with a registration created with a string handler and an `observer` option', function() {
      it('should invoke the method indicated by the string handler on the `observer` object', function() {
        spyOn(f, 'handler')
        spyOn(b, 'handler')
        f.on('change', 'handler', {observer: b});
        f.emit('change');
        expect(f.handler).not.toHaveBeenCalled()
        expect(b.handler).toHaveBeenCalledWith('change')
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
        spyOn(f, 'handler');
        f.on('change', 'handler', {once: true});
        f.emit('change');
        expect(f.handler.callCount).toBe(1);
        f.emit('change');
        expect(f.handler.callCount).toBe(1);
      });
    });

    it('should return the receiver', function() {
      expect(f.emit('change')).toBe(f);
    });

    it('should not trigger handlers registered for other events', function() {
      spyOn(f, 'handler');
      f.on('change', 'handler');
      f.emit('someEvent');
      expect(f.handler).not.toHaveBeenCalled();
    });
  });
});

}());

