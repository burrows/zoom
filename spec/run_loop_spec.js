(function() {

if (!this.Z) { require('./helper'); }

describe('Z.RunLoop', function() {
  describe('.once', function() {
    var Test, invocations, o1, o2;

    Test = Z.Object.extend(function() {
      this.def('foo', function() { invocations.push([this, 'foo']); });
      this.def('bar', function() { invocations.push([this, 'bar']); });
    });

    o1 = Test.create();
    o2 = Test.create();

    beforeEach(function() { invocations = []; });

    it('should invoke the given method on the given object at the end of the run loop', function() {
      runs(function() {
        Z.RunLoop.once(o1, 'foo');
        expect(invocations).toEq([]);
      });

      waits(5);

      runs(function() {
        expect(invocations).toEq([ [o1, 'foo'] ]);
      });
    });

    it('should invoke all queued methods at the end of the run loop', function() {
      runs(function() {
        Z.RunLoop.once(o1, 'foo');
        Z.RunLoop.once(o1, 'bar');
        Z.RunLoop.once(o2, 'foo');
        Z.RunLoop.once(o2, 'bar');
        expect(invocations).toEq([]);
      });

      waits(5);

      runs(function() {
        expect(invocations).toEq([
          [o1, 'foo'], [o1, 'bar'], [o2, 'foo'], [o2, 'bar']
        ]);
      });
    });

    it('should only invoke the method once even when called multiple times with the same arguments in the same run loop', function() {
      runs(function() {
        Z.RunLoop.once(o1, 'foo');
        Z.RunLoop.once(o2, 'bar');
        Z.RunLoop.once(o1, 'foo');
        Z.RunLoop.once(o2, 'bar');
        Z.RunLoop.once(o1, 'foo');
        Z.RunLoop.once(o2, 'bar');
        expect(invocations).toEq([]);
      });

      waits(5);

      runs(function() {
        expect(invocations).toEq([ [o1, 'foo'], [o2, 'bar'] ]);
      });
    });

    it('should clear the queue on each run', function() {
      runs(function() {
        Z.RunLoop.once(o1, 'foo');
        expect(invocations).toEq([]);
      });

      waits(5);

      runs(function() {
        expect(invocations).toEq([ [o1, 'foo'] ]);
        Z.RunLoop.once(o2, 'bar');
      });

      waits(5);

      runs(function() {
        expect(invocations).toEq([ [o1, 'foo'], [o2, 'bar'] ]);
      });
    });
  });
});

}());

