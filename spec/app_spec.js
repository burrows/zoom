(function() {

if (!this.Z) { require('./helper'); }

var container, Parent, Child1, Child2, Child3;

Child1 = Z.View.extend(function() {
  this.def('render', function() {
    this.node.innerHTML = '<p class="child1"></p>';
  });
});

Child2 = Z.View.extend(function() {
  this.def('render', function() {
    this.node.innerHTML = '<p class="child2"></p>';
  });
});

Child3 = Z.View.extend(function() {
  this.def('render', function() {
    this.node.innerHTML = '<p class="child3"></p>';
  });
});

Parent = Z.View.extend(function() {
  this.subview('sv1', Child1);
  this.subview('sv2', Child2);
});

describe('Z.App', function() {
  var container, app;

  beforeEach(function() {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    app = Z.App.create(Parent);
  });

  afterEach(function() {
    app.stop();
    document.body.removeChild(container);
  });

  describe('.init', function() {
    it('should throw an exception if not given a main view', function() {
      expect(function() {
        Z.App.create();
      }).toThrow('Z.App.init: must provide a sub-type of `Z.View` as the main view type');
    });

    it('should create the `mainWindow` property', function() {
      expect(app.mainWindow()).not.toBeNull();
      expect(app.get('mainWindow.app')).toBe(app);
      expect(app.get('mainWindow.mainView').isA(Parent)).toBe(true);
      expect(app.get('mainWindow.isMain')).toBe(true);
      expect(app.get('mainWindow.isKey')).toBe(true);
    });

    it('should default to using a `Z.Window` as the main window type', function() {
      expect(app.get('mainWindow.type')).toBe(Z.Window);
    });

    it('should use the given mainWindowType option to use as the main window type', function() {
      var W   = Z.Window.extend(),
          app = Z.App.create(Parent, {mainWindowType: W});
      expect(app.get('mainWindow.type')).toBe(W);
    });

    it('should create the root state of a statechart', function() {
      expect(app.statechart().isA(Z.State)).toBe(true);
      expect(app.statechart().superstate).toBeNull();
    });
  });

  describe('.start', function() {
    it('should set the first argument as the container property', function() {
      expect(app.container).toBe(null);
      app.start(container);
      expect(app.container).toBe(container);
    });

    it('should set `keyWindow` to `mainWindow`', function() {
      expect(app.keyWindow()).toBeNull();
      app.start(container);
      expect(app.keyWindow()).toBe(app.mainWindow());
    });

    it('should invoke `becomeKeyWindow` on the `mainWindow`', function() {
      spyOn(app.mainWindow(), 'becomeKeyWindow');
      app.start(container);
      expect(app.mainWindow().becomeKeyWindow).toHaveBeenCalled();
    });

    it('should attach `mainWindow` to `container`', function() {
      expect(document.querySelector('#test-container > .z-main-window')).toEqual(null);
      app.start(container);
      expect(document.querySelector('#test-container > .z-main-window')).not.toEqual(null);
    });

    it("should ensure that the mainWindow's `app` property is set", function() {
      var mainWin = app.mainWindow();

      app.start();
      expect(mainWin.app()).toBe(app);
      app.stop();
      expect(mainWin.app()).toBe(null);
      app.start(container);
      expect(mainWin.app()).toBe(app);
    });

    it('should attach all `windows` to `container`', function() {
      expect(container.querySelector('.child1')).toEqual(null);
      expect(container.querySelector('.child2')).toEqual(null);
      app.start(container);
      expect(container.querySelector('.child1')).not.toEqual(null);
      expect(container.querySelector('.child2')).not.toEqual(null);
    });

    it('should call `goto` on the statechart with an empty array when not given any initial states', function() {
      spyOn(app.statechart(), 'goto').andCallThrough();
      app.start(container);
      expect(app.statechart().goto).toHaveBeenCalledWith([]);
    });

    it('should call `goto` on the statechart with the given list of initial states', function() {
      app.statechart().state('a');
      spyOn(app.statechart(), 'goto').andCallThrough();
      app.start(container, ['/a']);
      expect(app.statechart().goto).toHaveBeenCalledWith(['/a']);
    });
  });

  describe('.stop', function() {
    it('should set `keyWindow` to `null`', function() {
      app.start(container);
      expect(app.keyWindow()).toBe(app.mainWindow());
      app.stop();
      expect(app.keyWindow()).toBeNull();
    });

    it('should detach `mainWindow` from `container`', function() {
      app.start(container);
      expect(document.querySelector('#test-container > .z-main-window')).not.toEqual(null);
      app.stop();
      expect(document.querySelector('#test-container > .z-main-window')).toEqual(null);
    });

    it('should detach all `windows` from `container`', function() {
      var window = Z.Window.create(Child3);

      app.addWindow(window);

      app.start(container);
      expect(container.querySelector('.child1')).not.toEqual(null);
      expect(container.querySelector('.child2')).not.toEqual(null);
      expect(container.querySelector('.child3')).not.toEqual(null);
      app.stop();
      expect(container.querySelector('.child1')).toEqual(null);
      expect(container.querySelector('.child2')).toEqual(null);
      expect(container.querySelector('.child3')).toEqual(null);
    });

    it('should reset the statechart', function() {
      app.start(container);
      spyOn(app.statechart(), 'reset').andCallThrough();
      app.stop();
      expect(app.statechart().reset).toHaveBeenCalled();
    });
  });

  describe('.displayWindows', function() {
    beforeEach(function() { app.container = container; });

    it("should render the app's windows", function() {
      expect(container.querySelector('.z-main-window')).toEqual(null);
      expect(container.querySelector('.z-main-window .child1')).toEqual(null);
      expect(container.querySelector('.z-main-window .child2')).toEqual(null);
      app.displayWindows();
      expect(container.querySelector('.z-main-window')).not.toEqual(null);
      expect(container.querySelector('.z-main-window .child1')).not.toEqual(null);
      expect(container.querySelector('.z-main-window .child2')).not.toEqual(null);
    });

    it('should notify the window and all of its subviews that their node has been attached', function() {
      expect(app.get('mainWindow.isNodeAttached')).toBe(false);
      expect(app.get('mainWindow.mainView.isNodeAttached')).toBe(false);
      expect(app.get('mainWindow.mainView.subviews').at(0).isNodeAttached()).toBe(false);
      expect(app.get('mainWindow.mainView.subviews').at(1).isNodeAttached()).toBe(false);
      app.displayWindows();
      expect(app.get('mainWindow.isNodeAttached')).toBe(true);
      expect(app.get('mainWindow.mainView.isNodeAttached')).toBe(true);
      expect(app.get('mainWindow.mainView.subviews').at(0).isNodeAttached()).toBe(true);
      expect(app.get('mainWindow.mainView.subviews').at(1).isNodeAttached()).toBe(true);
    });

    it("should attach window nodes to its container for windows added since the last time `displayWindows` was called", function() {
      var w = Z.Window.create(Child3);

      app.displayWindows();
      app.addWindow(w);
      expect(container.querySelector('.child3')).toEqual(null);
      app.displayWindows();
      expect(container.querySelector('.child3')).not.toEqual(null);
    });

    it('should notify newly added windows that their node has been attached', function() {
      var w = Z.Window.create(Child3);

      app.displayWindows();
      app.addWindow(w);
      expect(app.get('mainWindow.isNodeAttached')).toBe(true);
      expect(w.isNodeAttached()).toBe(false);
      expect(w.get('mainView.isNodeAttached')).toBe(false);

      app.displayWindows();
      expect(w.isNodeAttached()).toBe(true);
      expect(w.get('mainView.isNodeAttached')).toBe(true);
    });

    it("should remove window nodes for windows removed since the last time `displayWindows` was called", function() {
      var w = Z.Window.create(Child3);

      app.addWindow(w);
      app.displayWindows();
      expect(container.querySelector('.child3')).not.toEqual(null);
      app.removeWindow(w);
      expect(container.querySelector('.child3')).not.toEqual(null);
      app.displayWindows();
      expect(container.querySelector('.child3')).toEqual(null);
    });

    it('should notify newly removed windows that their node has been detached', function() {
      var w = Z.Window.create(Child3);

      app.addWindow(w);
      app.displayWindows();
      app.removeWindow(w);

      expect(app.get('mainWindow.isNodeAttached')).toBe(true);
      expect(w.isNodeAttached()).toBe(true);
      expect(w.get('mainView.isNodeAttached')).toBe(true);

      app.displayWindows();

      expect(app.get('mainWindow.isNodeAttached')).toBe(true);
      expect(w.isNodeAttached()).toBe(false);
      expect(w.get('mainView.isNodeAttached')).toBe(false);
    });
  });

  describe('.addWindow', function() {
    beforeEach(function() { app.start(container); });

    it('should throw an exception when not given a `Z.Window` object', function() {
      var o = Z.Object.create();

      expect(function() {
        app.addWindow(o);
      }).toThrow(Z.fmt('Z.App.addWindow: expected a `Z.Window` concrete instance, but received `%@` instead.', o));
    });

    it('should throw an exception when given a `Z.Window` type instead of a concrete instance', function() {
      expect(function() {
        app.addWindow(Z.Window);
      }).toThrow(Z.fmt('Z.App.addWindow: expected a `Z.Window` concrete instance, but received `%@` instead.', Z.Window));
    });

    it('should add the given concrete window object to the `windows` array', function() {
      var w = Z.Window.create(Child3);
      expect(app.windows()).toEq(Z.A(app.mainWindow()));
      app.addWindow(w);
      expect(app.windows()).toEq(Z.A(app.mainWindow(), w));
    });

    it("should set the window's app property to the receiver", function() {
      var w = Z.Window.create(Child3);
      expect(w.app()).toBe(null);
      app.addWindow(w);
      expect(w.app()).toBe(app);
    });

    it("should ensure the window's `isMain` property is set to `false`", function() {
      var w = Z.Window.create(Child3, {isMain: true});
      expect(w.isMain()).toBe(true);
      app.addWindow(w);
      expect(w.isMain()).toBe(false);
    });
  });

  describe('.removeWindow', function() {
    beforeEach(function() { app.start(container); });

    it('should throw an exception if the given window is not currently in the `windows` array', function() {
      var w = Z.Window.create(Child3);
      expect(function() {
        app.removeWindow(w);
      }).toThrow(Z.fmt("Z.App.removeWindow: given object does not exist in the app's `windows` array: %@", w));
    });

    it('should remove the window from the `windows` array', function() {
      var w = Z.Window.create(Child3);
      app.addWindow(w);
      expect(app.windows()).toEq(Z.A(app.mainWindow(), w));
      app.removeWindow(w);
      expect(app.windows()).toEq(Z.A(app.mainWindow()));
    });

    it("should set the window's app property to `null`", function() {
      var w = Z.Window.create(Child3);
      expect(w.app()).toBe(null);
      app.addWindow(w);
      expect(w.app()).toBe(app);
      app.removeWindow(w);
      expect(w.app()).toBe(null);
    });

  });

  describe('key window management', function() {
    var mainWindow, window1;

    beforeEach(function() {
      mainWindow = app.mainWindow();
      window1    = app.addWindow(Z.Window.create(Child3));
      app.start(container);
    });

    it('should set the main window to key window upon starting', function() {
      expect(app.keyWindow()).toBe(mainWindow);
      expect(mainWindow.isKey()).toBe(true);
      expect(window1.isKey()).toBe(false);
    });

    describe('.makeKeyWindow', function() {
      it('should throw an exception if the window is not owned by the application', function() {
        expect(function() {
          app.makeKeyWindow(Z.Window.create(Child3));
        }).toThrow("Z.App.makeKeyWindow: attempted to make a window that doesn't belong to the application the key window");
      });

      it('should set the key window to the given window', function() {
        app.makeKeyWindow(window1);

        expect(app.keyWindow()).toBe(window1);
        expect(mainWindow.isKey()).toBe(false);
        expect(window1.isKey()).toBe(true);
      });

      it('should invoke `resignKeyWindow` on the current key window', function() {
        var invoked = false;

        mainWindow.def('resignKeyWindow', function() { invoked = true; });

        app.makeKeyWindow(window1);
        expect(invoked).toBe(true);
      });

      it('should invoke `becomeKeyWindow` on the new key window', function() {
        var invoked = false;

        window1.def('becomeKeyWindow', function() { invoked = true; });

        app.makeKeyWindow(window1);
        expect(invoked).toBe(true);
      });

      it('should return the given window', function() {
        expect(app.makeKeyWindow(window1)).toBe(window1);
      });
    });
  });

  describe('.processEvent', function() {
    var mainWin, win1;

    beforeEach(function() {
      app.addWindow(Z.Window.create(Parent));
      app.start(container);

      mainWin = app.mainWindow();
      win1 = app.windows().at(1);
    });

    describe('with a `Z.MouseEvent`', function() {
      it('should make the window that a mouse down event occurs over the key window if its not already', function() {
        var e = Z.MouseEvent.create({
          kind   : Z.LeftMouseDown,
          window : win1,
          view   : win1.mainView(),
          node   : win1.get('mainView.sv1').node
        });

        expect(app.keyWindow()).toBe(mainWin);
        expect(mainWin.isKey()).toBe(true);
        expect(win1.isKey()).toBe(false);
        app.processEvent(e);
        expect(app.keyWindow()).toBe(win1);
        expect(mainWin.isKey()).toBe(false);
        expect(win1.isKey()).toBe(true);
      });

      it("should forward the event object to the window's `processEvent` method", function() {
        var e = Z.MouseEvent.create({
          kind   : Z.LeftMouseDown,
          window : mainWin,
          view   : mainWin.mainView(),
          node   : mainWin.get('mainView.sv1').node
        });

        spyOn(mainWin, 'processEvent');
        app.processEvent(e);
        expect(mainWin.processEvent).toHaveBeenCalledWith(e);
      });
    });

    describe('with a `Z.KeyEvent`', function() {
      it("should forward the event object to the key window's `processEvent` method", function() {
        var e = Z.KeyEvent.create({kind: Z.KeyDown});

        app.makeKeyWindow(win1);
        spyOn(win1, 'processEvent');
        app.processEvent(e);
        expect(win1.processEvent).toHaveBeenCalledWith(e);
      });
    });
  });

  describe('.send', function() {
    it('should invoke the given method on the app if its defined', function() {
      var a = Z.App.create(Parent);

      a.def('foo', function() { return true; });
      spyOn(a, 'foo').andCallThrough();
      a.send('foo', 1, 2);
      expect(a.foo).toHaveBeenCalledWith(1, 2);
      a.stop();
    });

    it('should delegate to the statechart if the method is defined but does not return true', function() {
      var a = Z.App.create(Parent);

      a.def('foo', function() { return false; });
      spyOn(a.statechart(), 'send');
      a.send('foo', 1, 2);
      expect(a.statechart().send).toHaveBeenCalledWith('foo', 1, 2);
      a.stop();
    });

    it('should not delegate to the statechart if the method is defined and returns true', function() {
      var a = Z.App.create(Parent);

      a.def('foo', function() { return true; });
      spyOn(a.statechart(), 'send');
      a.send('foo', 1, 2);
      expect(a.statechart().send).not.toHaveBeenCalled();
      a.stop();
    });

    it('should delegate to the statechart if the given method is not defined', function() {
      var a = Z.App.create(Parent);

      spyOn(a.statechart(), 'send');
      a.send('foo', 1, 2);
      expect(a.statechart().send).toHaveBeenCalledWith('foo', 1, 2);
      a.stop();
    });
  });

  describe('.current', function() {
    it('should delegate to the statechart', function() {
      var a = Z.App.create(Parent).open(function() {
        this.statechart().state('a');
        this.statechart().state('b');
      });

      a.start(container, ['/b']);
      expect(a.get('statechart.current')).toEq(['/b']);
      expect(a.get('current')).toEq(['/b']);
      a.stop();
    });
  });
});

}());

