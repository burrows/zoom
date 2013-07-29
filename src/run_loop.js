Z.RunLoop = Z.Object.create().open(function() {
  var _this     = this,
      apps      = Z.A(),
      routers   = Z.A(),
      listeners = Z.H(),
      running   = false;

  function processKeyEvent(e) {
    if (apps.any(function(app) { app.processEvent(e); })) { _this.run(); }
  }

  function processMouseEvent(e) {
    if (e.window.app().processEvent(e)) { _this.run(); }
  }

  this.def('registerApp', function(app) {
    apps.push(app);

    if (this.__started__) {
      listeners.at(app,
        Z.MouseEventListener.create(app.container, processMouseEvent));
    }

    return this;
  });

  this.def('deregisterApp', function(app) {
    apps.remove(app);

    if (this.__started__ && listeners.hasKey(app)) {
      listeners.del(app).destroy();
    }

    return this;
  });

  this.def('registerRouter', function(router) {
    routers.push(router);
    return this;
  });

  this.def('deregisterRouter', function(router) {
    routers.remove(router);
    return this;
  });

  this.def('start', function() {
    if (!this.__started__) {
      this.__keyListener__ = Z.KeyEventListener.create(processKeyEvent);

      apps.each(function(app) {
        listeners.at(app, Z.MouseEventListener.create(app.container,
          processMouseEvent));
      });

      this.__started__ = true;
    }

    return this;
  });

  this.def('stop', function() {
    if (this.__started__) {
      this.__keyListener__.destroy();
      this.__keyListener__ = null;

      apps.each(function(app) {
        listeners.del(app).destroy();
      });

      this.__started__ = false;
    }

    return this;
  });

  this.def('run', function() {
    if (!running) {
      running = true;
      // flush bindings
      apps.each('displayWindows');
      routers.each('updateHash');
      running = false;
    }

    return this;
  });
});
