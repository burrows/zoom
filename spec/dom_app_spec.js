(function() {

if (!this.Z) { require('./helper'); }

var TestView1, TestView2, container;

TestView1 = Z.DOMView.extend(function() {
  this.def('draw', function() {
    var node = this.node(), child;
    if (!node.firstChild) {
      child = document.createElement('p');
      child.className = 'test-view-1';
      node.appendChild(child);
    }
  });
});

TestView2 = Z.DOMView.extend(function() {
  this.def('draw', function() {
    var node = this.node(), child;
    if (!node.firstChild) {
      child = document.createElement('p');
      child.className = 'test-view-2';
      node.appendChild(child);
    }
  });
});

describe('Z.DOMWindow', function() {
  var container = document.createElement('div'), app;

  container.id = 'test-container';

  beforeEach(function() {
    document.body.appendChild(container);
    app = Z.DOMApp.create(TestView1, container);
  });

  afterEach(function() {
    app.destroy();
    document.body.removeChild(container);
  });

  describe('Z.DOMApp `container` property', function() {
    it('should default to `document.body`', function() {
      var app = Z.DOMApp.create(Z.DOMView);
      expect(app.container()).toBe(document.body);
    });
  });

  describe('Z.DOMApp.initialize', function() {
    it('should throw an exception if not given a main window type', function() {
      expect(function() {
        Z.DOMApp.create();
      }).toThrow('Z.DOMApp.initialize: must provide a sub-type of `Z.DOMView` as the main view type');

      expect(function() {
        Z.DOMApp.create(Z.DOMView.create());
      }).toThrow('Z.DOMApp.initialize: must provide a sub-type of `Z.DOMView` as the main view type');
    });

    it('should create the `mainWindow` property', function() {
      var app = Z.DOMApp.create(TestView1);

      expect(app.mainWindow()).not.toBeNull();
      expect(app.get('mainWindow.app')).toBe(app);
      expect(app.get('mainWindow.contentView').isA(TestView1)).toBe(true);
      expect(app.get('mainWindow.isMain')).toBe(true);
      expect(app.get('mainWindow.isKey')).toBe(true);
    });

    it('should set the second argument as the container property', function() {
      var app = Z.DOMApp.create(TestView1, container);
      expect(app.container()).toBe(container);
    });
  });

  describe('Z.DOMApp.createWindow', function() {
    it('should create a new `Z.DOMWindow` object and add it to the `windows` property', function() {
      var window = app.createWindow(TestView2);

      expect(app.windows().at(1)).toBe(window);
      expect(window.app()).toBe(app);
      expect(window.isMain()).toBe(false);
      expect(window.contentView().isA(TestView2)).toBe(true);
    });

    it('should not draw or attach the window to the container when the app is not started', function() {
      var window = app.createWindow(TestView2);
      expect(window.node().querySelector('.test-view-2')).toEqual(null);
      expect(container.querySelector('#z-view-' + window.objectId())).toEqual(null);
    });

    it('should draw the window and append it to `container` when the app is started', function() {
      var window;
      
      app.start();
      
      window = app.createWindow(TestView2);
      expect(window.node().querySelector('.test-view-2')).not.toEqual(null);
      expect(container.querySelector('#z-view-' + window.objectId())).not.toEqual(null);
    });
  });

  describe('Z.DOMApp.destroyWindow', function() {
    it('should throw an exception if passed `mainWindow`', function() {
      expect(function() {
        app.destroyWindow(app.mainWindow());
      }).toThrow("Z.DOMApp.destroyWindow: can't destroy the main window");
    });

    it('should throw an exception if passed a window object thats not in its `windows` array', function() {
      expect(function() {
        app.destroyWindow(Z.DOMWindow.create());
      }).toThrow("Z.DOMApp.destroyWindow: attempted to destroy a window that doesn't belong to the application");
    });

    it('should remove the given window from the `windows` array', function() {
      var window = app.createWindow(TestView2);

      expect(app.windows().contains(window)).toBe(true);
      app.destroyWindow(window);
      expect(app.windows().contains(window)).toBe(false);
    });

    it("should detach the window's node from `container` when the app is started", function() {
      var window = app.start().createWindow(TestView2);

      expect(container.querySelector('.test-view-2')).not.toEqual(null);
      app.destroyWindow(window);
      expect(container.querySelector('.test-view-2')).toEqual(null);
    });
  });

  describe('Z.DOMApp.start', function() {
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
      var window = app.createWindow(TestView2);

      expect(container.querySelector('.test-view-1')).toEqual(null);
      expect(container.querySelector('.test-view-2')).toEqual(null);
      app.start();
      expect(container.querySelector('.test-view-1')).not.toEqual(null);
      expect(container.querySelector('.test-view-2')).not.toEqual(null);
    });
  });

  describe('Z.DOMApp.stop', function() {
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
      var window = app.createWindow(TestView2);

      app.start();
      expect(container.querySelector('.test-view-1')).not.toEqual(null);
      expect(container.querySelector('.test-view-2')).not.toEqual(null);
      app.stop();
      expect(container.querySelector('.test-view-1')).toEqual(null);
      expect(container.querySelector('.test-view-2')).toEqual(null);
    });
  });
});

}());

