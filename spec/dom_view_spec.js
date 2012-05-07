(function() {

if (!this.Z) { require('./helper'); }

var slice, TestView1, TestView2, TestView3, TestCompoundView;

slice = Array.prototype.slice;

TestView1 = Z.DOMView.extend(function() {
  this.def('draw', function() {
    this.node().innerHTML = '<div class="test-view-1"></div>';
  });
});

TestView2 = Z.DOMView.extend(function() {
  this.def('draw', function() {
    this.node().innerHTML = '<div class="test-view-2"></div>';
  });
});

TestView3 = Z.DOMView.extend(function() {
  this.def('draw', function() {
    this.node().innerHTML = '<div class="test-view-3"></div>';
  });
});

TestCompoundView = Z.DOMView.extend();

describe('Z.DOMView', function() {
  describe('.initialize', function() {
    it('should create a detached empty DOM node', function() {
      var v = TestView1.create(), node = v.node();

      expect(node).not.toBeNull();
      expect(node instanceof window.HTMLElement).toBe(true);
      expect(node.parentNode).toBeNull();
      expect(node.id).toBe('z-view-' + v.objectId());
      expect(node.className).toBe('z-view');
      expect(node.innerHTML).toBe('');
      v.destroy();
    });
  });

  describe('.viewForNode', function() {
    it('should return the `Z.DOMView` object that owns the node', function() {
      var v1 = TestView1.create(), v2 = TestView2.create();

      expect(Z.DOMView.viewForNode(document.body)).toBeNull();
      expect(Z.DOMView.viewForNode(v1.node())).toBe(v1);
      expect(Z.DOMView.viewForNode(v2.node())).toBe(v2);
    });
  });

  describe('.addSubview', function() {
    var v, sv1, sv2, sv3;

    beforeEach(function() {
      v   = TestCompoundView.create();
      sv1 = TestView1.create();
      sv2 = TestView2.create();
      sv3 = TestView3.create();
    });

    it('should insert the given view to the `subviews` array at the given index', function() {
      v.addSubview(sv1, 0);
      expect(v.subviews()).toEq(Z.A(sv1));
      v.addSubview(sv2, 1);
      expect(v.subviews()).toEq(Z.A(sv1, sv2));
      v.addSubview(sv3, 1);
      expect(v.subviews()).toEq(Z.A(sv1, sv3, sv2));
    });

    it('should append the given view to the `subviews` array when not given an index', function() {
      v.addSubview(sv1);
      expect(v.subviews()).toEq(Z.A(sv1));
      v.addSubview(sv2);
      expect(v.subviews()).toEq(Z.A(sv1, sv2));
      v.addSubview(sv3);
      expect(v.subviews()).toEq(Z.A(sv1, sv2, sv3));
    });

    it("should set the subview's `superview` property to the receiver", function() {
      expect(sv1.superview()).toBeNull();
      v.addSubview(sv1);
      expect(sv1.superview()).toBe(v);
    });

    it('should remove the given view from its current `superview` if it has one', function() {
      var v2 = TestCompoundView.create();

      v2.addSubview(sv1);
      expect(v2.subviews().contains(sv1)).toBe(true);
      v.addSubview(sv1);
      expect(v2.subviews().contains(sv1)).toBe(false);
    });

    it("should attach the added subview's node to the receiever's node at the same index the subview resides in", function() {
      expect(sv1.node().parentNode).toBe(null);
      v.addSubview(sv1);
      expect(sv1.node().parentNode).toBe(v.node());
      v.addSubview(sv2);
      expect(sv2.node().parentNode).toBe(v.node());
      v.addSubview(sv3, 1);

      expect(slice.call(v.node().childNodes)).toEq([sv1.node(), sv3.node(), sv2.node()]);
    });
  });
});

}());

