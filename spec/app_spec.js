(function() {

if (!this.Z) { require('./helper'); }

var container, Parent, Child1, Child2, Child3;

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

Child3 = Z.View.extend(function() {
  this.def('render', function() {
    this.node().innerHTML = '<p class="child3"></p>';
  });
});

Parent = Z.View.extend(function() {
  this.def('initialize', function(props) {
    this.supr(props);
    this.addSubview(Child1.create());
    this.addSubview(Child2.create());
  });
});

describe('Z.App', function() {
  var container, app;

  beforeEach(function() {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    app = Z.App.create(Parent, container);
  });

  afterEach(function() {
    document.body.removeChild(container);
  });

  describe('`container` property', function() {
    it('should default to `document.body`', function() {
      var app = Z.App.create(Z.View);
      expect(app.container()).toBe(document.body);
    });
  });

  describe('.initialize', function() {
    it('should throw an exception if not given a main view', function() {
      expect(function() {
        Z.App.create();
      }).toThrow('Z.App.initialize: must provide a sub-type of `Z.View` as the main view type');
    });

    it('should create the `mainWindow` property', function() {
      expect(app.mainWindow()).not.toBeNull();
      expect(app.get('mainWindow.app')).toBe(app);
      expect(app.get('mainWindow.contentView').isA(Parent)).toBe(true);
      expect(app.get('mainWindow.isMain')).toBe(true);
      expect(app.get('mainWindow.isKey')).toBe(true);
    });

    it('should set the second argument as the container property', function() {
      var app = Z.App.create(Parent, container);
      expect(app.container()).toBe(container);
    });
  });

  describe('.start', function() {
    it('should set `isRunning` to `true`', function() {
      expect(app.isRunning()).toBe(false);
      app.start();
      expect(app.isRunning()).toBe(true);
    });

    it('should set `keyWindow` to `mainWindow`', function() {
      expect(app.keyWindow()).toBeNull();
      app.start();
      expect(app.keyWindow()).toBe(app.mainWindow());
    });

    it('should attach `mainWindow` to `container`', function() {
      expect(document.querySelector('#test-container > .z-main-window')).toEqual(null);
      app.start();
      expect(document.querySelector('#test-container > .z-main-window')).not.toEqual(null);
    });

    it('should attach all `windows` to `container`', function() {
      expect(container.querySelector('.child1')).toEqual(null);
      expect(container.querySelector('.child2')).toEqual(null);
      app.start();
      expect(container.querySelector('.child1')).not.toEqual(null);
      expect(container.querySelector('.child2')).not.toEqual(null);
    });
  });

  describe('.stop', function() {
    it('should set `isRunning` to `false`', function() {
      app.start();
      expect(app.isRunning()).toBe(true);
      app.stop();
      expect(app.isRunning()).toBe(false);
    });

    it('should set `keyWindow` to `null`', function() {
      app.start();
      expect(app.keyWindow()).toBe(app.mainWindow());
      app.stop();
      expect(app.keyWindow()).toBeNull();
    });

    it('should detach `mainWindow` from `container`', function() {
      app.start();
      expect(document.querySelector('#test-container > .z-main-window')).not.toEqual(null);
      app.stop();
      expect(document.querySelector('#test-container > .z-main-window')).toEqual(null);
    });

    it('should detach all `windows` from `container`', function() {
      var window = Z.Window.create(Child3);

      app.addWindow(window);

      app.start();
      expect(container.querySelector('.child1')).not.toEqual(null);
      expect(container.querySelector('.child2')).not.toEqual(null);
      expect(container.querySelector('.child3')).not.toEqual(null);
      app.stop();
      expect(container.querySelector('.child1')).toEqual(null);
      expect(container.querySelector('.child2')).toEqual(null);
      expect(container.querySelector('.child3')).toEqual(null);
    });
  });

  describe('.displayWindows', function() {
    it("should render the app's windows", function() {
      expect(container.querySelector('.z-main-window')).toEqual(null);
      expect(container.querySelector('.z-main-window .child1')).toEqual(null);
      expect(container.querySelector('.z-main-window .child2')).toEqual(null);
      app.displayWindows();
      expect(container.querySelector('.z-main-window')).not.toEqual(null);
      expect(container.querySelector('.z-main-window .child1')).not.toEqual(null);
      expect(container.querySelector('.z-main-window .child2')).not.toEqual(null);
    });

    it("should attach window nodes to its container for windows added since the last time `displayWindows` was called", function() {
      var w = Z.Window.create(Child3);

      app.displayWindows();
      app.addWindow(w);
      expect(container.querySelector('.child3')).toEqual(null);
      app.displayWindows();
      expect(container.querySelector('.child3')).not.toEqual(null);
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
  });

  describe('.addWindow', function() {
    it('should throw an exception when not given a `Z.Window` object', function() {
      var o = Z.Object.create();

      expect(function() {
        app.addWindow(o);
      }).toThrow(Z.fmt('Z.App.addWindow: expected a `Z.Window` object, but received `%@` instead.', o));
    });

    it('should add the given concrete window object to the `windows` array', function() {
      var w = Z.Window.create(Child3);
      expect(app.windows()).toEq(Z.A(app.mainWindow()));
      app.addWindow(w);
      expect(app.windows()).toEq(Z.A(app.mainWindow(), w));
    });

    it('should create a concrete instance when given a window type object and add it to the `windows` array', function() {
      var type = Z.Window.extend(function() {
        this.def('initialize', function(opts) {
          this.supr(Child3, opts);
        });
      });
      expect(app.windows().size()).toBe(1);
      app.addWindow(type);
      expect(app.windows().size()).toBe(2);
      expect(app.get('windows.last').isA(type)).toBe(true);
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
  });

  describe('key window management', function() {
    var mainWindow, window1;

    beforeEach(function() {
      mainWindow = app.mainWindow();
      window1    = app.addWindow(Z.Window.create(Child3));
      app.start();
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

      it('should invoke `willResignKeyWindow` on the current key window', function() {
        var invoked = false;

        mainWindow.def('willResignKeyWindow', function() { invoked = true; });

        app.makeKeyWindow(window1);
        expect(invoked).toBe(true);
      });

      it('should invoke `didBecomeKeyWindow` on the new key window', function() {
        var invoked = false;

        window1.def('didBecomeKeyWindow', function() { invoked = true; });

        app.makeKeyWindow(window1);
        expect(invoked).toBe(true);
      });
    });
  });

  //describe('event handling', function() {
  //  var mainWin, parent, child1, child2;

  //  beforeEach(function() {
  //    app.start();
  //    mainWin = app.get('mainWindow');
  //    parent  = app.get('mainWindow.contentView');
  //    child1  = app.get('mainWindow.contentView.subviews').at(0);
  //    child2  = app.get('mainWindow.contentView.subviews').at(1);
  //  });

  //  describe('for an event on a DOM element within the application', function() {
  //    it('should be delivered to the view where the event originated', function() {
  //      var elem = child1.node().querySelector('.child1'), event;

  //      child1.def('handleEvent', function(e) { event = e; });

  //      simulateMouseEvent(elem, 'mousedown');

  //      expect(event).not.toBeUndefined();
  //      expect(event.target).toBe(elem);
  //      expect(event.type).toBe('mousedown');
  //    });

  //    it('should bubble the event along the superview chain', function() {
  //      var elem = child2.node().querySelector('.child2'), invocations = [];

  //      child2.def('handleEvent', function() { invocations.push(this); });
  //      parent.def('handleEvent', function() { invocations.push(this); });
  //      mainWin.def('handleEvent', function() { invocations.push(this); });

  //      simulateMouseEvent(elem, 'mousedown');
  //      expect(invocations).toEq([child2, parent, mainWin]);
  //    });

  //    it('should stop bubbling the event when a handler returns `true`', function() {
  //      var elem = child2.node().querySelector('.child2'), invocations = [];

  //      child2.def('handleEvent', function() { invocations.push(this); });
  //      parent.def('handleEvent', function() { invocations.push(this); return true; });
  //      mainWin.def('handleEvent', function() { invocations.push(this); });

  //      simulateMouseEvent(elem, 'mousedown');
  //      expect(invocations).toEq([child2, parent]);
  //    });
  //  });
  //});
});

}());

