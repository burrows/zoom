(function() {

if (!this.Z) { require('./helper'); }

var container, Parent, Child1, Child2, Child3;

Child1 = Z.DOMView.extend(function() {
  this.def('draw', function() {
    this.node().innerHTML = '<p class="child1"></p>';
  });
});

Child2 = Z.DOMView.extend(function() {
  this.def('draw', function() {
    this.node().innerHTML = '<p class="child2"></p>';
  });
});

Child3 = Z.DOMView.extend(function() {
  this.def('draw', function() {
    this.node().innerHTML = '<p class="child3"></p>';
  });
});

Parent = Z.DOMView.extend(function() {
  this.def('initialize', function(props) {
    this.supr(props);
    this.addSubview(Child1.create());
    this.addSubview(Child2.create());
  });
});

describe('Z.DOMApp', function() {
  var container = document.createElement('div'), app;

  container.id = 'test-container';

  beforeEach(function() {
    document.body.appendChild(container);
    app = Z.DOMApp.create(Parent, container);
  });

  afterEach(function() {
    app.destroy();
    document.body.removeChild(container);
  });

  describe('`container` property', function() {
    it('should default to `document.body`', function() {
      var app = Z.DOMApp.create(Z.DOMView);
      expect(app.container()).toBe(document.body);
    });
  });

  describe('.initialize', function() {
    it('should throw an exception if not given a main window type', function() {
      expect(function() {
        Z.DOMApp.create();
      }).toThrow('Z.DOMApp.initialize: must provide a sub-type of `Z.DOMView` as the main view type');

      expect(function() {
        Z.DOMApp.create(Z.DOMView.create());
      }).toThrow('Z.DOMApp.initialize: must provide a sub-type of `Z.DOMView` as the main view type');
    });

    it('should create the `mainWindow` property', function() {
      expect(app.mainWindow()).not.toBeNull();
      expect(app.get('mainWindow.app')).toBe(app);
      expect(app.get('mainWindow.contentView').isA(Parent)).toBe(true);
      expect(app.get('mainWindow.isMain')).toBe(true);
      expect(app.get('mainWindow.isKey')).toBe(true);
    });

    it('should set the second argument as the container property', function() {
      var app = Z.DOMApp.create(Parent, container);
      expect(app.container()).toBe(container);
    });
  });

  describe('.createWindow', function() {
    it('should create a new `Z.DOMWindow` object and add it to the `windows` property', function() {
      var window = app.createWindow(Child3);

      expect(app.windows().at(1)).toBe(window);
      expect(window.app()).toBe(app);
      expect(window.isMain()).toBe(false);
      expect(window.contentView().isA(Child3)).toBe(true);
    });

    it('should not draw or attach the window to the container when the app is not started', function() {
      var window = app.createWindow(Child3);
      expect(window.node().querySelector('.child3')).toEqual(null);
      expect(container.querySelector('#z-view-' + window.objectId())).toEqual(null);
    });

    it('should draw the window and append it to `container` when the app is started', function() {
      var window;
      
      app.start();
      
      window = app.createWindow(Child3);
      expect(window.node().querySelector('.child3')).not.toEqual(null);
      expect(container.querySelector('#z-view-' + window.objectId())).not.toEqual(null);
    });
  });

  describe('.destroyWindow', function() {
    it('should throw an exception if passed `mainWindow`', function() {
      expect(function() {
        app.destroyWindow(app.mainWindow());
      }).toThrow("Z.DOMApp.destroyWindow: can't destroy the main window");
    });

    it('should throw an exception if passed a window object thats not in its `windows` array', function() {
      expect(function() {
        app.destroyWindow(Z.DOMWindow.create(Child3));
      }).toThrow("Z.DOMApp.destroyWindow: attempted to destroy a window that doesn't belong to the application");
    });

    it('should remove the given window from the `windows` array', function() {
      var window = app.createWindow(Child3);

      expect(app.windows().contains(window)).toBe(true);
      app.destroyWindow(window);
      expect(app.windows().contains(window)).toBe(false);
    });

    it("should detach the window's node from `container` when the app is started", function() {
      var window = app.start().createWindow(Child3);

      expect(container.querySelector('.child3')).not.toEqual(null);
      app.destroyWindow(window);
      expect(container.querySelector('.child3')).toEqual(null);
    });
  });

  describe('.start', function() {
    it('should set `isStarted` to `true`', function() {
      expect(app.isStarted()).toBe(false);
      app.start();
      expect(app.isStarted()).toBe(true);
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
      var window = app.createWindow(Child3);

      expect(container.querySelector('.child1')).toEqual(null);
      expect(container.querySelector('.child2')).toEqual(null);
      expect(container.querySelector('.child3')).toEqual(null);
      app.start();
      expect(container.querySelector('.child1')).not.toEqual(null);
      expect(container.querySelector('.child2')).not.toEqual(null);
      expect(container.querySelector('.child3')).not.toEqual(null);
    });
  });

  describe('.stop', function() {
    it('should set `isStarted` to `false`', function() {
      app.start();
      expect(app.isStarted()).toBe(true);
      app.stop();
      expect(app.isStarted()).toBe(false);
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
      var window = app.createWindow(Child3);

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

  describe('key window management', function() {
    var mainWindow, window1;

    beforeEach(function() {
      mainWindow = app.mainWindow();
      window1    = app.createWindow(Child3);
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
          app.makeKeyWindow(Z.DOMWindow.create(Child3));
        }).toThrow("Z.DOMApp.makeKeyWindow: attempted to make a window that doesn't belong to the application the key window");
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

  describe('event handling', function() {
    var mainWin, parent, child1, child2;

    beforeEach(function() {
      app.start();
      mainWin = app.get('mainWindow');
      parent  = app.get('mainWindow.contentView');
      child1  = app.get('mainWindow.contentView.subviews').at(0);
      child2  = app.get('mainWindow.contentView.subviews').at(1);
    });

    describe('for an event on a DOM element within the application', function() {
      it('should be delivered to the view where the event originated', function() {
        var elem = child1.node().querySelector('.child1'), event;

        child1.def('handleEvent', function(e) { event = e; });

        simulateMouseEvent(elem, 'mousedown');

        expect(event).not.toBeUndefined();
        expect(event.target).toBe(elem);
        expect(event.type).toBe('mousedown');
      });

      it('should bubble the event along the superview chain', function() {
        var elem = child2.node().querySelector('.child2'), invocations = [];

        child2.def('handleEvent', function() { invocations.push(this); });
        parent.def('handleEvent', function() { invocations.push(this); });
        mainWin.def('handleEvent', function() { invocations.push(this); });

        simulateMouseEvent(elem, 'mousedown');
        expect(invocations).toEq([child2, parent, mainWin]);
      });

      it('should stop bubbling the event when a handler returns `true`', function() {
        var elem = child2.node().querySelector('.child2'), invocations = [];

        child2.def('handleEvent', function() { invocations.push(this); });
        parent.def('handleEvent', function() { invocations.push(this); return true; });
        mainWin.def('handleEvent', function() { invocations.push(this); });

        simulateMouseEvent(elem, 'mousedown');
        expect(invocations).toEq([child2, parent]);
      });
    });
  });
});

}());

