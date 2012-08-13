(function() {

if (!this.Z) { require('./helper'); }

describe('Z.RunLoop', function() {
  var app, runLoop;

  beforeEach(function() {
    var container = document.createElement('div');

    document.body.appendChild(container);

    app = {
      displayWindows: function() {},
      dispatchEvent: function() {},
      container: container
    };

    runLoop = Z.RunLoop.create(app);
  });

  afterEach(function() {
    runLoop.destroy();
    document.body.removeChild(app.container);
  });

  describe('.run', function() {
    var o1, o2;

    beforeEach(function() {
      o1 = Z.Object.create();
      o2 = Z.Object.create();

      o1.def('foo', function() {});
      o2.def('foo', function() {});
    });

    it("should invoke the app's displayWindows method", function() {
      spyOn(app, 'displayWindows');
      runLoop.run();
      expect(app.displayWindows).toHaveBeenCalled();
    });

    it("should invoke all methods queued up with the once method", function() {
      spyOn(o1, 'foo');
      spyOn(o2, 'foo');

      runLoop.once(o1, 'foo');
      runLoop.once(o2, 'foo');

      runLoop.run();

      expect(o1.foo).toHaveBeenCalled();
      expect(o1.foo.callCount).toBe(1);
    });

    it("should invoke once methods one time even when they are queued multiple times", function() {
      spyOn(o1, 'foo');

      runLoop.once(o1, 'foo');
      runLoop.once(o1, 'foo');
      runLoop.once(o1, 'foo');
      runLoop.once(o1, 'foo');

      runLoop.run();

      expect(o1.foo).toHaveBeenCalled();
      expect(o1.foo.callCount).toBe(1);
    });

    it("should clear the once queue", function() {
      spyOn(o1, 'foo');

      runLoop.once(o1, 'foo');

      runLoop.run();

      expect(o1.foo).toHaveBeenCalled();
      expect(o1.foo.callCount).toBe(1);

      runLoop.run();

      expect(o1.foo.callCount).toBe(1);
    });
  });

  describe('mouse event listener', function() {
    it("should observe events on the app's container and invoke the run method", function() {
      spyOn(app, 'dispatchEvent').andReturn(true);
      spyOn(runLoop, 'run');
      simulateMouseEvent(app.container, 'mousedown');
      expect(runLoop.run).toHaveBeenCalled();
      expect(runLoop.run.callCount).toBe(1);
    });

    it('should create a MouseMove event when the left mouse button is up and a MouseDrag event when it is down', function() {
      spyOn(app, 'dispatchEvent');
      simulateMouseEvent(app.container, 'mousemove');
      expect(app.dispatchEvent.argsForCall[0][0].kind).toBe(Z.MouseMove);
      simulateMouseEvent(app.container, 'mousedown');
      simulateMouseEvent(app.container, 'mousemove');
      expect(app.dispatchEvent.argsForCall[2][0].kind).toBe(Z.MouseDrag);
      simulateMouseEvent(app.container, 'mouseup');
      simulateMouseEvent(app.container, 'mousemove');
      expect(app.dispatchEvent.argsForCall[4][0].kind).toBe(Z.MouseMove);
    });
  });

  describe('destroy', function() {
    it('should teardown event handlers', function() {
      spyOn(app, 'dispatchEvent');
      simulateMouseEvent(app.container, 'mousemove');
      expect(app.dispatchEvent.callCount).toBe(1);
      runLoop.destroy();
      simulateMouseEvent(app.container, 'mousemove');
      expect(app.dispatchEvent.callCount).toBe(1);
    });
  });
});

}());

