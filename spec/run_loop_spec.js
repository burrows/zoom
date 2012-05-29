(function() {

if (!this.Z) { require('./helper'); }

describe('Z.RunLoop', function() {
  var container1, container2, app1, app2, Child1, Child2;

  Child1 = Z.View.extend(function() {
    this.def('render', function() {
      this.node().innerHTML = '<p class="child1"></p>';
    });
  });

  Child2 = Z.View.extend(function() {
    this.def('render', function() {
      this.node().innerHTML = '<p class="child2"></p>';
    });
  });

  beforeEach(function() {
    container1 = document.createElement('div');
    container1.id = 'test-container-1';
    document.body.appendChild(container1);
    app1 = Z.App.create(Child1, container1);

    container2 = document.createElement('div');
    container2.id = 'test-container-2';
    document.body.appendChild(container2);
    app2 = Z.App.create(Child2, container2);
  });

  afterEach(function() {
    document.body.removeChild(container1);
    document.body.removeChild(container2);
  });

  describe('.once', function() {
    var Test, invocations, o1, o2;

    Test = Z.Object.extend(function() {
      this.def('foo', function() { invocations.push([this, 'foo']); });
      this.def('bar', function() { invocations.push([this, 'bar']); });
    });

    o1 = Test.create();
    o2 = Test.create();

    beforeEach(function() { invocations = []; Z.RunLoop.start(); });

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

  describe('.run', function() {
    it('should invoke the `displayWindows` on all registered apps', function() {
      spyOn(app1, 'displayWindows');
      spyOn(app2, 'displayWindows');
      Z.RunLoop.run();
      expect(app1.displayWindows).not.toHaveBeenCalled();
      expect(app2.displayWindows).not.toHaveBeenCalled();
      Z.RunLoop.registerApp(app1);
      Z.RunLoop.run();
      expect(app1.displayWindows).toHaveBeenCalled();
      expect(app2.displayWindows).not.toHaveBeenCalled();
      app1.displayWindows.reset();
      Z.RunLoop.registerApp(app2);
      Z.RunLoop.run();
      expect(app1.displayWindows).toHaveBeenCalled();
      expect(app2.displayWindows).toHaveBeenCalled();
    });
  });

  describe('mouse event handling', function() {
    beforeEach(function() { app1.start(); app2.start(); });
    afterEach(function() { app1.stop(); app2.stop(); });

    it('should invoke the `dispatchMouseEvent` method on the app containing the view where the event occured', function() {
      spyOn(app1, 'dispatchMouseEvent');
      spyOn(app2, 'dispatchMouseEvent');

      simulateMouseEvent(document.querySelector('.child1'), 'mousedown');
      expect(app1.dispatchMouseEvent).toHaveBeenCalled();
      expect(app2.dispatchMouseEvent).not.toHaveBeenCalled();

      app1.dispatchMouseEvent.reset();
      app2.dispatchMouseEvent.reset();

      simulateMouseEvent(document.querySelector('.child2'), 'mousedown');
      expect(app1.dispatchMouseEvent).not.toHaveBeenCalled();
      expect(app2.dispatchMouseEvent).toHaveBeenCalled();
    });
  });
});

}());

