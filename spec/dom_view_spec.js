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
  describe('node property', function() {
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

  describe('.destroy', function() {
    it('should remove the view from its superview', function() {
      var v1 = TestCompoundView.create(),
          v2 = TestCompoundView.create();

      v1.addSubview(v2);
      expect(v2.superview()).toBe(v1);
      expect(v1.subviews()).toEq(Z.A(v2));
      expect(slice.call(v1.node().childNodes)).toEq([v2.node()]);
      v2.destroy()
      expect(v2.superview()).toBeNull();
      expect(v1.subviews()).toEq(Z.A());
      expect(slice.call(v1.node().childNodes)).toEq([]);
    });

    it('should remove the view from the cache that `viewForNode` uses', function() {
      var v = TestCompoundView.create();

      expect(Z.DOMView.viewForNode(v.node())).toBe(v);
      v.destroy();
      expect(Z.DOMView.viewForNode(v.node())).toBeNull();
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

    it('should throw an execption if the given index is invalid', function() {
      expect(function() {
        v.addSubview(sv1, -1);
      }).toThrow('Z.DOMView.addSubview: invalid index (-1) for: ' + v.toString());

      v.addSubview(sv1);

      expect(function() {
        v.addSubview(sv2, 2);
      }).toThrow('Z.DOMView.addSubview: invalid index (2) for: ' + v.toString());
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

    it('should properly move an existing subview to the new index when the new index is lower than the original', function() {
      v.addSubview(sv1);
      v.addSubview(sv2);
      v.addSubview(sv3);

      v.addSubview(sv3, 1);
      expect(v.subviews()).toEq(Z.A(sv1, sv3, sv2));
      expect(slice.call(v.node().childNodes)).toEq([sv1.node(), sv3.node(), sv2.node()]);
    });

    it('should properly move an existing subview to the new index when the new index is greater than the original', function() {
      v.addSubview(sv1);
      v.addSubview(sv2);
      v.addSubview(sv3);

      v.addSubview(sv1, 2);
      expect(v.subviews()).toEq(Z.A(sv2, sv3, sv1));
      expect(slice.call(v.node().childNodes)).toEq([sv2.node(), sv3.node(), sv1.node()]);
    });
  });

  describe('.addSubviewBefore', function() {
    it('should throw an exception if the reference view is not a subview', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create();

      expect(function() {
        v.addSubviewBefore(sv1, sv2);
      }).toThrow('Z.DOMView.addSubviewBefore: reference view is not a subview: ' + v.toString());
    });

    it('should add the given subview before the reference subview', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create(),
          sv3 = TestView3.create();

      v.addSubview(sv1);
      v.addSubviewBefore(sv1, sv2);
      expect(v.subviews()).toEq(Z.A(sv2, sv1));
      expect(slice.call(v.node().childNodes)).toEq([sv2.node(), sv1.node()]);
      v.addSubviewBefore(sv1, sv3);
      expect(v.subviews()).toEq(Z.A(sv2, sv3, sv1));
      expect(slice.call(v.node().childNodes)).toEq([sv2.node(), sv3.node(), sv1.node()]);
    });
  });

  describe('.addSubviewAfter', function() {
    it('should throw an exception if the reference view is not a subview', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create();

      expect(function() {
        v.addSubviewAfter(sv1, sv2);
      }).toThrow('Z.DOMView.addSubviewAfter: reference view is not a subview: ' + v.toString());
    });

    it('should add the given subview after the reference subview', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create(),
          sv3 = TestView3.create();

      v.addSubview(sv1);
      v.addSubviewAfter(sv1, sv2);
      expect(v.subviews()).toEq(Z.A(sv1, sv2));
      expect(slice.call(v.node().childNodes)).toEq([sv1.node(), sv2.node()]);
      v.addSubviewAfter(sv1, sv3);
      expect(v.subviews()).toEq(Z.A(sv1, sv3, sv2));
      expect(slice.call(v.node().childNodes)).toEq([sv1.node(), sv3.node(), sv2.node()]);
    });
  });

  describe('.replaceSubview', function() {
    it('should throw an exception if the old view is not a subview', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create();

      expect(function() {
        v.replaceSubview(sv1, sv2);
      }).toThrow('Z.DOMView.replaceSubview: old view is not a subview: ' + v.toString());
    });

    it('should remove the old subview and add the new subview in its place', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create(),
          sv3 = TestView3.create();

      v.addSubview(sv1);
      v.addSubview(sv2);

      v.replaceSubview(sv1, sv3);
      expect(v.subviews()).toEq(Z.A(sv3, sv2));
      expect(slice.call(v.node().childNodes)).toEq([sv3.node(), sv2.node()]);
    });

    it('should properly handle replacing a view with an existing subview', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create(),
          sv3 = TestView3.create();

      v.addSubview(sv1);
      v.addSubview(sv2);
      v.addSubview(sv3);

      v.replaceSubview(sv1, sv2);
      expect(v.subviews()).toEq(Z.A(sv2, sv3));
      expect(slice.call(v.node().childNodes)).toEq([sv2.node(), sv3.node()]);

      v.addSubview(sv1);
      v.replaceSubview(sv2, sv3);
      expect(v.subviews()).toEq(Z.A(sv3, sv1));
      expect(slice.call(v.node().childNodes)).toEq([sv3.node(), sv1.node()]);
    });
  });

  describe('.removeSubview', function() {
    var v, sv1, sv2, sv3;

    beforeEach(function() {
      v   = TestCompoundView.create();
      sv1 = TestView1.create();
      sv2 = TestView2.create();
      sv3 = TestView3.create();

      v.addSubview(sv1);
      v.addSubview(sv2);
      v.addSubview(sv3);
    });

    it('should throw an exception if the given view is not in the `subviews` array', function() {
      var v2 = TestView1.create();

      expect(function() {
        v.removeSubview(v2);
      }).toThrow('Z.DOMView.removeSubview: given view is not a subview: ' + v2.toString());
    });

    it('should throw an exception if the given index is not in range', function() {
      var v2 = TestView1.create();

      expect(function() {
        v.removeSubview(12);
      }).toThrow('Z.DOMView.removeSubview: given index (12) is not in range');
    });

    it('should remove the given view from the `subviews` array', function() {
      expect(v.subviews()).toEq(Z.A(sv1, sv2, sv3));
      v.removeSubview(sv2);
      expect(v.subviews()).toEq(Z.A(sv1, sv3));
      v.removeSubview(sv3);
      expect(v.subviews()).toEq(Z.A(sv1));
      v.removeSubview(sv1);
      expect(v.subviews()).toEq(Z.A());
    });

    it("should set the subview's `superview` property to null", function() {
      expect(sv1.superview()).toBe(v);
      v.removeSubview(sv1);
      expect(sv1.superview()).toBeNull();
    });

    it("should detach the removed subview's node from the receiever's node", function() {
      expect(sv1.node().parentNode).toBe(v.node());
      expect(sv2.node().parentNode).toBe(v.node());
      expect(sv3.node().parentNode).toBe(v.node());

      v.removeSubview(sv1);
      v.removeSubview(sv3);

      expect(sv1.node().parentNode).toBeNull();
      expect(sv2.node().parentNode).toBe(v.node());
      expect(sv3.node().parentNode).toBeNull(v);
    });

    it('should remove the subview at the given index when given a number instead of a view', function() {
      expect(v.subviews()).toEq(Z.A(sv1, sv2, sv3));
      v.removeSubview(1);
      expect(v.subviews()).toEq(Z.A(sv1, sv3));
    });
  });

  describe('.remove', function() {
    it('should remove the receiver from its superview', function() {
      var v1 = TestCompoundView.create(),
          v2 = TestCompoundView.create();

      v1.addSubview(v2);

      expect(v2.superview()).toBe(v1);
      expect(v1.subviews()).toEq(Z.A(v2));
      expect(slice.call(v1.node().childNodes)).toEq([v2.node()]);

      expect(v2.remove()).toBe(v2);

      expect(v2.superview()).toBeNull();
      expect(v1.subviews()).toEq(Z.A());
      expect(slice.call(v1.node().childNodes)).toEq([]);
    });
  });

  describe('.isDescendantOf', function() {
    it('should return `true` if the receiver is a descendant of the the given view and `false` otherwise', function() {
      var v1   = TestCompoundView.create(),
          v11  = TestCompoundView.create(),
          v12  = TestCompoundView.create(),
          v111 = TestCompoundView.create();
          v112 = TestCompoundView.create();

      v1.addSubview(v11);
      v1.addSubview(v12);
      v11.addSubview(v111);
      v11.addSubview(v112);

      expect(v111.isDescendantOf(v11)).toBe(true);
      expect(v111.isDescendantOf(v1)).toBe(true);
      expect(v112.isDescendantOf(v11)).toBe(true);
      expect(v112.isDescendantOf(v1)).toBe(true);

      expect(v111.isDescendantOf(v12)).toBe(false);
      expect(v112.isDescendantOf(v12)).toBe(false);
    });
  });

  describe('.isAncestorOf', function() {
    it('should return `true` if the receiver is an ancestor of the given view and `false` otherwise', function() {
      var v1   = TestCompoundView.create(),
          v11  = TestCompoundView.create(),
          v12  = TestCompoundView.create(),
          v111 = TestCompoundView.create();
          v112 = TestCompoundView.create();

      v1.addSubview(v11);
      v1.addSubview(v12);
      v11.addSubview(v111);
      v11.addSubview(v112);

      expect(v1.isAncestorOf(v11)).toBe(true);
      expect(v1.isAncestorOf(v12)).toBe(true);
      expect(v1.isAncestorOf(v111)).toBe(true);
      expect(v1.isAncestorOf(v112)).toBe(true);
      expect(v11.isAncestorOf(v111)).toBe(true);
      expect(v11.isAncestorOf(v112)).toBe(true);

      expect(v12.isAncestorOf(v111)).toBe(false);
      expect(v12.isAncestorOf(v112)).toBe(false);
    });
  });

  describe('.draw', function() {
    it('should invoke `draw` on all subviews', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create();

      v.addSubview(sv1);
      v.addSubview(sv2);

      expect(v.node().querySelector('.test-view-1')).toEqual(null);
      expect(v.node().querySelector('.test-view-2')).toEqual(null);
      v.draw();
      expect(v.node().querySelector('.test-view-1')).not.toEqual(null);
      expect(v.node().querySelector('.test-view-2')).not.toEqual(null);
    });
  });
});

}());

