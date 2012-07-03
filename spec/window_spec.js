(function() {

var TestView;

if (!this.Z) { require('./helper'); }

TestView = Z.View.extend(function() {
  this.def('render', function() {
    this.node().innerHTML = '<div class="test-view-1"></div>';
  });
});

describe('Z.Window', function() {
  describe('.initialize', function() {
    it('should create a concrete instance of the given view type and set it as the `contentView`', function() {
      var w = Z.Window.create(TestView), cv = w.contentView();
      expect(cv.isType).toBe(false);
      expect(cv.isA(TestView)).toBe(true);
    });

    it('should assign the given concrete view instance as the `contentView`', function() {
      var cv = TestView.create(), w = Z.Window.create(cv);
      expect(w.contentView()).toBe(cv);
    });

    it('should add the `contentView` as a subview', function() {
      var w = Z.Window.create(TestView), cv = w.contentView();
      expect(cv.superview()).toBe(w);
      expect(w.subviews().contains(cv)).toBe(true);
    });

    it('should set the `window` property on each view in the content view hierarchy', function() {
      var ContentView = Z.View.extend(function() {
        this.subview('sv1', Z.View);
        this.subview('sv2', Z.View);
      }), w = Z.Window.create(ContentView);

      expect(w.get('contentView.window')).toBe(w);
      expect(w.get('contentView.sv1.window')).toBe(w);
      expect(w.get('contentView.sv2.window')).toBe(w);
    });
  });

  describe('node property', function() {
    it('should have the class `z-window`', function() {
      var w = Z.Window.create(Z.View), node = w.node();
      expect(node.className).toMatch(/\bz-window\b/);
    });

    it('should have the class `z-main-window` when the `isMain` property is set', function() {
      var w = Z.Window.create(Z.View, {isMain: true}), node = w.node();
      expect(node.className).toMatch(/\bz-window\b/);
      expect(node.className).toMatch(/\bz-main-window\b/);
    });
  });

  describe('.makeKeyView', function() {
    var w, sv1, sv2;

    beforeEach(function() {
      w = Z.Window.create(Z.View.extend(function() {
        this.subview('sv1', TestView);
        this.subview('sv2', TestView);
      }));

      sv1 = w.get('contentView.sv1');
      sv2 = w.get('contentView.sv2');

      w.keyView(sv1);
    });

    it('should do nothing if the given view is already the key view and return `true`', function() {
      spyOn(sv1, 'resignKeyView');
      spyOn(sv1, 'becomeKeyView');
      expect(w.makeKeyView(sv1)).toBe(true);
      expect(sv1.resignKeyView).not.toHaveBeenCalled();
      expect(sv1.becomeKeyView).not.toHaveBeenCalled();
    });

    describe('given a view', function() {
      it('should call `resignKeyView` on the current `keyView`', function() {
        spyOn(sv1, 'resignKeyView');
        w.makeKeyView(sv2);
        expect(sv1.resignKeyView).toHaveBeenCalled();
      });

      it('should not change `keyView` when `resignKeyView` returns `false`', function() {
        sv1.resignKeyView = function() { return false; };
        w.makeKeyView(sv2);
        expect(w.keyView()).toBe(sv1);
      });

      it('should return `false` when `resignKeyView` returns `false`', function() {
        sv1.resignKeyView = function() { return false; };
        expect(w.makeKeyView(sv2)).toBe(false);
      });

      it('should call `becomeKeyView` on given view', function() {
        spyOn(sv2, 'becomeKeyView');
        w.makeKeyView(sv2);
        expect(sv2.becomeKeyView).toHaveBeenCalled();
      });

      it('should set `keyView` to `null` when `becomeKeyView` returns `false`', function() {
        sv2.becomeKeyView = function() { return false; };
        w.makeKeyView(sv2);
        expect(w.keyView()).toBeNull();
      });

      it('should return `true` when `becomeKeyView` returns `false`', function() {
        sv2.becomeKeyView = function() { return false; };
        expect(w.makeKeyView(sv2)).toBe(true);
      });
    });

    describe('given `null`', function() {
      it('should call `resignKeyView` on the current `keyView`', function() {
        spyOn(sv1, 'resignKeyView');
        w.makeKeyView(null);
        expect(sv1.resignKeyView).toHaveBeenCalled();
      });

      it('should not change `keyView` when `resignKeyView` returns `false`', function() {
        sv1.resignKeyView = function() { return false; };
        w.makeKeyView(null);
        expect(w.keyView()).toBe(sv1);
      });

      it('should return `false` when `resignKeyView` returns `false`', function() {
        sv1.resignKeyView = function() { return false; };
        expect(w.makeKeyView(null)).toBe(false);
      });

      it('should set `keyView` to `null` when `resignKeyView` returns `true`', function() {
        sv1.resignKeyView = function() { return true; };
        w.makeKeyView(null);
        expect(w.keyView()).toBeNull();
      });

      it('should return `true` when `resignKeyView` returns `true`', function() {
        sv1.resignKeyView = function() { return true; };
        expect(w.makeKeyView(null)).toBe(true);
      });
    });
  });

  describe('.becomeKeyWindow', function() {
    it('should set `isKey` and `needsDisplay` to `true`', function() {
      var w = Z.Window.create(TestView);

      w.display();

      expect(w.isKey()).toBe(false);
      expect(w.needsDisplay()).toBe(false);
      w.becomeKeyWindow();
      expect(w.isKey()).toBe(true);
      expect(w.needsDisplay()).toBe(true);
    });

    describe('when `keyView` is `null`', function() {
      it('should call `makeKeyView` with `initialKeyView` if it is currently accepting key view status and set it to the `keyView` property', function() {
        var w = Z.Window.create(Z.View.extend(function() {
          this.subview('sv', TestView.extend(function() {
            this.def('acceptsKeyView', function() { return true; });
          }));
        })), sv = w.get('contentView.sv');

        w.initialKeyView(sv);

        spyOn(w, 'makeKeyView');
        w.becomeKeyWindow();
        expect(w.makeKeyView).toHaveBeenCalledWith(sv);
      });

      it('should not call `makeKeyView` with `initialKeyView` if it is not currently accepting key view status', function() {
        var w = Z.Window.create(Z.View.extend(function() {
          this.subview('sv', TestView.extend(function() {
            this.def('acceptsKeyView', function() { return false; });
          }));
        })), sv = w.get('contentView.sv');

        w.initialKeyView(sv);
        w.display();

        spyOn(w, 'makeKeyView');
        w.becomeKeyWindow();
        expect(w.makeKeyView).not.toHaveBeenCalledWith(sv);
      });
    });

    describe('when `keyView` is not `null`', function() {
      var w, sv1, sv2;

      beforeEach(function() {
        w = Z.Window.create(Z.View.extend(function() {
          this.subview('sv1', TestView);
          this.subview('sv2', TestView);
        }));

        sv1 = w.get('contentView.sv1');
        sv2 = w.get('contentView.sv2');

        w.initialKeyView(sv1);
        w.keyView(sv1);
      });

      it('should do nothing', function() {
        spyOn(sv1, 'becomeKeyView');
        spyOn(sv1, 'resignKeyView');
        w.becomeKeyWindow();
        expect(sv1.becomeKeyView).not.toHaveBeenCalled();
        expect(sv1.resignKeyView).not.toHaveBeenCalled();
        expect(w.keyView()).toBe(sv1);
      });
    });
  });

  describe('.resignKeyWindow', function() {
    var w, sv1, sv2;

    beforeEach(function() {
      w = Z.Window.create(Z.View.extend(function() {
        this.subview('sv1', TestView);
        this.subview('sv2', TestView);
      }));

      sv1 = w.get('contentView.sv1');
      sv2 = w.get('contentView.sv2');
    });

    it('should set `isKey` to `false` and `needsDisplay` to `true`', function() {
      w.becomeKeyWindow();
      w.display();

      expect(w.isKey()).toBe(true);
      expect(w.needsDisplay()).toBe(false);

      w.resignKeyWindow();

      expect(w.isKey()).toBe(false);
      expect(w.needsDisplay()).toBe(true);
    });
  });

  describe('.selectNextKeyView', function() {
    var w, sv1, sv2, sv3;

    beforeEach(function() {
      w = Z.Window.create(Z.View.extend(function() {
        this.subview('sv1', TestView);
        this.subview('sv2', TestView);
        this.subview('sv3', TestView);
      }));

      sv1 = w.get('contentView.sv1');
      sv2 = w.get('contentView.sv2');
      sv3 = w.get('contentView.sv3');

      sv1.nextKeyView = function() { return null; };
      sv2.nextKeyView = function() { return null; };
      sv3.nextKeyView = function() { return null; };

      w.initialKeyView(sv1);
    });

    it("should make the current key view's next valid key view the key view", function() {
      w.makeKeyView(sv1);
      sv1.nextKeyView = function() { return sv2; };
      sv2.acceptsKeyView = function() { return true; };
      w.selectNextKeyView();
      expect(w.keyView()).toBe(sv2);
    });

    it('should make `initialKeyView` the key view when the current key view is null or has no next valid key view', function() {
      w.makeKeyView(null);
      sv1.acceptsKeyView = function() { return true; };
      w.selectNextKeyView();
      expect(w.keyView()).toBe(sv1);

      w.makeKeyView(sv2);
      sv1.acceptsKeyView = function() { return true; };
      w.selectNextKeyView();
      expect(w.keyView()).toBe(sv1);
    });

    it("should make `initialKeyView`'s next valid key view the key view when `initialKeyView` does not accept key view ", function() {
      w.makeKeyView(sv3);
      sv1.acceptsKeyView = function() { return false; }
      sv1.nextKeyView = function() { return sv2; };
      sv2.acceptsKeyView = function() { return true; }
      w.selectNextKeyView();
      expect(w.keyView()).toBe(sv2);
    });

    it("should set the key view to null when a next valid key view can't be found", function() {
      w.makeKeyView(sv3);
      sv1.acceptsKeyView = function() { return false; }
      w.selectNextKeyView();
      expect(w.keyView()).toBeNull();
    });
  });

  describe('.selectPreviousKeyView', function() {
    var w, sv1, sv2, sv3;

    beforeEach(function() {
      w = Z.Window.create(Z.View.extend(function() {
        this.subview('sv1', TestView);
        this.subview('sv2', TestView);
        this.subview('sv3', TestView);
      }));

      sv1 = w.get('contentView.sv1');
      sv2 = w.get('contentView.sv2');
      sv3 = w.get('contentView.sv3');

      sv1.previousKeyView = function() { return null; };
      sv2.previousKeyView = function() { return null; };
      sv3.previousKeyView = function() { return null; };

      w.initialKeyView(sv1);
    });

    it("should make the current key view's previous valid key view the key view", function() {
      w.makeKeyView(sv2);
      sv2.previousKeyView = function() { return sv1; };
      sv1.acceptsKeyView = function() { return true; };
      w.selectPreviousKeyView();
      expect(w.keyView()).toBe(sv1);
    });

    it('should make `initialKeyView` the key view when the current key view is null or has no previous valid key view', function() {
      w.makeKeyView(null);
      sv1.acceptsKeyView = function() { return true; };
      w.selectPreviousKeyView();
      expect(w.keyView()).toBe(sv1);

      w.makeKeyView(sv3);
      sv1.acceptsKeyView = function() { return true; };
      w.selectPreviousKeyView();
      expect(w.keyView()).toBe(sv1);
    });

    it("should make `initialKeyView`'s previous valid key view the key view when `initialKeyView` does not accept key view ", function() {
      w.makeKeyView(sv2);
      sv1.acceptsKeyView = function() { return false; }
      sv1.previousKeyView = function() { return sv3; };
      sv3.acceptsKeyView = function() { return true; }
      w.selectPreviousKeyView();
      expect(w.keyView()).toBe(sv3);
    });

    it("should set the key view to null when a previous valid key view can't be found", function() {
      w.makeKeyView(sv3);
      sv1.acceptsKeyView = function() { return false; }
      w.selectPreviousKeyView();
      expect(w.keyView()).toBeNull();
    });
  });
});

}());

