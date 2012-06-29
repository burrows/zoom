(function() {

if (!this.Z) { require('./helper'); }

var slice, TestView1, TestView2, TestView3, TestCompoundView;

slice = Array.prototype.slice;

TestView1 = Z.View.extend(function() {
  this.def('render', function() {
    this.node().innerHTML = '<div class="test-view-1"></div>';
  });
});

TestView2 = Z.View.extend(function() {
  this.def('render', function() {
    this.node().innerHTML = '<div class="test-view-2"></div>';
  });
});

TestView3 = Z.View.extend(function() {
  this.def('render', function() {
    this.node().innerHTML = '<div class="test-view-3"></div>';
  });
});

TestCompoundView = Z.View.extend();

describe('Z.View', function() {
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

    it('should contain the classes returned by the `classes` method', function() {
      var V = Z.View.extend(function() {
        this.def('classes', function() {
          return this.supr().concat('foo', 'bar');
        });
      }), v;

      v = V.create();

      expect(v.node().className.match(/foo/)).toBeTruthy();
      expect(v.node().className.match(/bar/)).toBeTruthy();
    });
  });

  describe('.viewForNode', function() {
    it('should return the `Z.View` object that owns the node', function() {
      var v1 = TestView1.create(), v2 = TestView2.create();

      expect(Z.View.viewForNode(document.body)).toBeNull();
      expect(Z.View.viewForNode(v1.node())).toBe(v1);
      expect(Z.View.viewForNode(v2.node())).toBe(v2);
    });
  });

  describe('.destroy', function() {
    it('should remove the view from its superview', function() {
      var v1 = TestCompoundView.create(),
          v2 = TestCompoundView.create();

      v1.addSubview(v2);
      expect(v2.superview()).toBe(v1);
      expect(v1.subviews()).toEq(Z.A(v2));
      v2.destroy()
      expect(v2.superview()).toBeNull();
      expect(v1.subviews()).toEq(Z.A());
    });

    it('should remove the view from the cache that `viewForNode` uses', function() {
      var v = TestCompoundView.create();

      expect(Z.View.viewForNode(v.node())).toBe(v);
      v.destroy();
      expect(Z.View.viewForNode(v.node())).toBeNull();
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
      }).toThrow('Z.View.addSubview: invalid index (-1) for: ' + v.toString());

      v.addSubview(sv1);

      expect(function() {
        v.addSubview(sv2, 2);
      }).toThrow('Z.View.addSubview: invalid index (2) for: ' + v.toString());
    });

    it('should set the `needsDisplay` property to `true`', function() {
      v.display();
      expect(v.needsDisplay()).toBe(false);
      v.addSubview(sv1);
      expect(v.needsDisplay()).toBe(true);
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

    it('should properly move an existing subview to the new index when the new index is lower than the original', function() {
      v.addSubview(sv1);
      v.addSubview(sv2);
      v.addSubview(sv3);

      v.addSubview(sv3, 1);
      expect(v.subviews()).toEq(Z.A(sv1, sv3, sv2));
    });

    it('should properly move an existing subview to the new index when the new index is greater than the original', function() {
      v.addSubview(sv1);
      v.addSubview(sv2);
      v.addSubview(sv3);

      v.addSubview(sv1, 2);
      expect(v.subviews()).toEq(Z.A(sv2, sv3, sv1));
    });
  });

  describe('.addSubviewBefore', function() {
    it('should throw an exception if the reference view is not a subview', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create();

      expect(function() {
        v.addSubviewBefore(sv1, sv2);
      }).toThrow('Z.View.addSubviewBefore: reference view is not a subview: ' + v.toString());
    });

    it('should add the given subview before the reference subview', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create(),
          sv3 = TestView3.create();

      v.addSubview(sv1);
      v.addSubviewBefore(sv1, sv2);
      expect(v.subviews()).toEq(Z.A(sv2, sv1));
      v.addSubviewBefore(sv1, sv3);
      expect(v.subviews()).toEq(Z.A(sv2, sv3, sv1));
    });
  });

  describe('.addSubviewAfter', function() {
    it('should throw an exception if the reference view is not a subview', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create();

      expect(function() {
        v.addSubviewAfter(sv1, sv2);
      }).toThrow('Z.View.addSubviewAfter: reference view is not a subview: ' + v.toString());
    });

    it('should add the given subview after the reference subview', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create(),
          sv3 = TestView3.create();

      v.addSubview(sv1);
      v.addSubviewAfter(sv1, sv2);
      expect(v.subviews()).toEq(Z.A(sv1, sv2));
      v.addSubviewAfter(sv1, sv3);
      expect(v.subviews()).toEq(Z.A(sv1, sv3, sv2));
    });
  });

  describe('.replaceSubview', function() {
    it('should throw an exception if the old view is not a subview', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create();

      expect(function() {
        v.replaceSubview(sv1, sv2);
      }).toThrow('Z.View.replaceSubview: old view is not a subview: ' + v.toString());
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

      v.addSubview(sv1);
      v.replaceSubview(sv2, sv3);
      expect(v.subviews()).toEq(Z.A(sv3, sv1));
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
      }).toThrow('Z.View.removeSubview: given view is not a subview: ' + v2.toString());
    });

    it('should throw an exception if the given index is not in range', function() {
      var v2 = TestView1.create();

      expect(function() {
        v.removeSubview(12);
      }).toThrow('Z.View.removeSubview: given index (12) is not in range');
    });

    it('should set the `needsDisplay` property to `true`', function() {
      v.display();
      expect(v.needsDisplay()).toBe(false);
      v.removeSubview(sv1);
      expect(v.needsDisplay()).toBe(true);
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

    it('should remove the subview at the given index when given a number instead of a view', function() {
      expect(v.subviews()).toEq(Z.A(sv1, sv2, sv3));
      v.removeSubview(1);
      expect(v.subviews()).toEq(Z.A(sv1, sv3));
    });

    it('should return the removed view', function() {
      expect(v.removeSubview(1)).toBe(sv2);
      expect(v.removeSubview(sv3)).toBe(sv3);
    });
  });

  describe('.remove', function() {
    it('should remove the receiver from its superview', function() {
      var v1 = TestCompoundView.create(),
          v2 = TestCompoundView.create();

      v1.addSubview(v2);

      expect(v2.superview()).toBe(v1);
      expect(v1.subviews()).toEq(Z.A(v2));

      expect(v2.remove()).toBe(v2);

      expect(v2.superview()).toBeNull();
      expect(v1.subviews()).toEq(Z.A());
    });
  });

  describe('.window', function() {
    it('should return `null` if the view is not attached to a window', function() {
      var v1  = TestCompoundView.create(),
          v11 = TestCompoundView.create(),
          v12 = TestCompoundView.create();

      v1.addSubview(v11);
      v1.addSubview(v12);

      expect(v1.window()).toBe(null);
      expect(v11.window()).toBe(null);
      expect(v12.window()).toBe(null);
    });

    it('should return the `Z.Window` object the view is attached to', function() {
      var v1  = TestCompoundView.create(),
          v11 = TestCompoundView.create(),
          v12 = TestCompoundView.create(),
          w;

      v1.addSubview(v11);
      v1.addSubview(v12);

      w = Z.Window.create(v1);

      expect(w.window()).toBe(w);
      expect(v1.window()).toBe(w);
      expect(v11.window()).toBe(w);
      expect(v12.window()).toBe(w);
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

  describe('.display', function() {
    it('should render the view', function() {
      var v = TestView1.create();

      expect(v.node().querySelector('.test-view-1')).toEqual(null);
      v.display();
      expect(v.node().querySelector('.test-view-1')).not.toEqual(null);
    });

    it('should render the subviews', function() {
      var v = TestCompoundView.create();

      v.addSubview(TestView1.create());
      v.addSubview(TestView2.create());

      expect(v.node().querySelector('.test-view-1')).toEqual(null);
      expect(v.node().querySelector('.test-view-2')).toEqual(null);
      v.display();
      expect(v.node().querySelector('.test-view-1')).not.toEqual(null);
      expect(v.node().querySelector('.test-view-2')).not.toEqual(null);
    });

    it('should render and attach subview nodes for subviews added since the last time `display` was called', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create(),
          sv3 = TestView3.create();

      v.addSubview(sv1);
      v.display();

      expect(slice.call(v.node().childNodes)).toEq([sv1.node()]);
      v.addSubview(sv2);
      expect(slice.call(v.node().childNodes)).toEq([sv1.node()]);
      v.display();
      expect(slice.call(v.node().childNodes)).toEq([sv1.node(), sv2.node()]);
      v.addSubview(sv3, 0);
      expect(slice.call(v.node().childNodes)).toEq([sv1.node(), sv2.node()]);
      v.display();
      expect(slice.call(v.node().childNodes)).toEq([sv3.node(), sv1.node(), sv2.node()]);
    });

    it('should remove subview nodes for subviews removed since the last time `display` was called', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create(),
          sv3 = TestView3.create();

      v.addSubview(sv1);
      v.addSubview(sv2);
      v.addSubview(sv3);
      v.display();

      expect(slice.call(v.node().childNodes)).toEq([sv1.node(), sv2.node(), sv3.node()]);
      sv2.remove();
      expect(slice.call(v.node().childNodes)).toEq([sv1.node(), sv2.node(), sv3.node()]);
      v.display();
      expect(slice.call(v.node().childNodes)).toEq([sv1.node(), sv3.node()]);
      v.removeSubview(sv1);
      expect(slice.call(v.node().childNodes)).toEq([sv1.node(), sv3.node()]);
      v.display();
      expect(slice.call(v.node().childNodes)).toEq([sv3.node()]);
      v.removeSubview(sv3);
      expect(slice.call(v.node().childNodes)).toEq([sv3.node()]);
      v.display();
      expect(slice.call(v.node().childNodes)).toEq([]);
    });

    it('should replace subview nodes for subviews that were replaced since the last time `display` was called', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create(),
          sv3 = TestView3.create();

      v.addSubview(sv1);
      v.addSubview(sv2);
      v.display();

      expect(slice.call(v.node().childNodes)).toEq([sv1.node(), sv2.node()]);
      v.replaceSubview(sv1, sv3);
      expect(slice.call(v.node().childNodes)).toEq([sv1.node(), sv2.node()]);
      v.display();
      expect(slice.call(v.node().childNodes)).toEq([sv3.node(), sv2.node()]);
      v.replaceSubview(sv2, sv1);
      expect(slice.call(v.node().childNodes)).toEq([sv3.node(), sv2.node()]);
      v.display();
      expect(slice.call(v.node().childNodes)).toEq([sv3.node(), sv1.node()]);
    });

    it('should set `needsDisplay` property to `false`', function() {
      var v = TestView1.create();

      expect(v.needsDisplay()).toBe(true);
      v.display();
      expect(v.needsDisplay()).toBe(false);
    });

    it('should notify newly added subviews that their node has been attached', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create(),
          sv3 = TestView3.create();

      v.addSubview(sv1);
      v.addSubview(sv2);
      v.display();

      // we're not attached to a window here, so nodes never actually get
      // attached to the DOM, so we have to fake being attached here
      v.notifyDidAttachNode();

      v.addSubview(sv3);

      expect(v.isNodeAttached()).toBe(true);
      expect(sv1.isNodeAttached()).toBe(true);
      expect(sv2.isNodeAttached()).toBe(true);
      expect(sv3.isNodeAttached()).toBe(false);

      v.display();

      expect(v.isNodeAttached()).toBe(true);
      expect(sv1.isNodeAttached()).toBe(true);
      expect(sv2.isNodeAttached()).toBe(true);
      expect(sv3.isNodeAttached()).toBe(true);
    });

    it('should notify newly removed subviews that their node has been detached', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create(),
          sv3 = TestView3.create();

      v.addSubview(sv1);
      v.addSubview(sv2);
      v.addSubview(sv3);
      v.display();

      // we're not attached to a window here, so nodes never actually get
      // attached to the DOM, so we have to fake being attached here
      v.notifyDidAttachNode();

      v.removeSubview(sv2);

      expect(v.isNodeAttached()).toBe(true);
      expect(sv1.isNodeAttached()).toBe(true);
      expect(sv2.isNodeAttached()).toBe(true);
      expect(sv3.isNodeAttached()).toBe(true);

      v.display();

      expect(v.isNodeAttached()).toBe(true);
      expect(sv1.isNodeAttached()).toBe(true);
      expect(sv2.isNodeAttached()).toBe(false);
      expect(sv3.isNodeAttached()).toBe(true);
    });
  });

  describe('.subview', function() {
    it('should throw an error when called on a concrete object', function() {
      var v = TestView1.create();

      expect(function() {
        v.subview('foo', TestView2);
      }).toThrow('Z.View.subview: must be called on a view type: ' + v.toString());
    });
  });

  describe('.initialize with subviews defined by `.subview`', function() {
    it('should instantiate the subview types and add the instances to the `subviews` array', function() {
      var V, v;

      V = Z.View.extend(function() {
        this.subview('test1', TestView1);
        this.subview('test2', TestView2);
        this.subview('test3', TestView3);
      });

      v = V.create();

      expect(v.get('subviews.size')).toBe(3);
      expect(v.subviews().at(0).isA(TestView1)).toBe(true);
      expect(v.subviews().at(1).isA(TestView2)).toBe(true);
      expect(v.subviews().at(2).isA(TestView3)).toBe(true);
    });

    it('should set the subview instances to the property name they were defined with', function() {
      var V, v;

      V = Z.View.extend(function() {
        this.subview('test1', TestView1);
        this.subview('test2', TestView2);
        this.subview('test3', TestView3);
      });

      v = V.create();

      expect(v.test1().isA(TestView1)).toBe(true);
      expect(v.test2().isA(TestView2)).toBe(true);
      expect(v.get('test3').isA(TestView3)).toBe(true);
    });
  });

  describe('.displayPaths', function() {
    var Person, V, v;

    Person = Z.Object.extend(function() { this.prop('name'); });

    V = Z.View.extend(function() {
      this.prop('foo');
      this.prop('content');
      this.def('displayPaths', function() {
        return this.supr().concat('foo', 'content.name');
      });
    });

    beforeEach(function() {
      p = Person.create({name: 'Ed'});
      v = V.create({content: p}).display();
    });

    it('should cause the view to set its `needsDisplay` property whenever one of the given paths change', function() {
      expect(v.needsDisplay()).toBe(false);
      v.foo(2);
      expect(v.needsDisplay()).toBe(true);
      v.display();
      expect(v.needsDisplay()).toBe(false);
      p.name('Bob');
      expect(v.needsDisplay()).toBe(true);
    });

    it('should remove the observers when the view is destroyed', function() {
      expect(v.needsDisplay()).toBe(false);
      v.foo(2);
      expect(v.needsDisplay()).toBe(true);
      v.display()
      expect(v.needsDisplay()).toBe(false);
      v.destroy();
      v.foo(3);
      expect(v.needsDisplay()).toBe(false);

    });
  });
});

}());

