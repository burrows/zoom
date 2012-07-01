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
  });

  describe('.resignKeyWindow', function() {
    it('should set `isKey` to `false` and `needsDisplay` to `true`', function() {
      var w = Z.Window.create(TestView);

      w.becomeKeyWindow();
      w.display();

      expect(w.isKey()).toBe(true);
      expect(w.needsDisplay()).toBe(false);

      w.resignKeyWindow();

      expect(w.isKey()).toBe(false);
      expect(w.needsDisplay()).toBe(true);
    });
  });
});

}());

