(function() {

if (!this.Z) { require('./helper'); }

var slice, TestView1, TestView2, TestView3, TestCompoundView;

slice = Array.prototype.slice;

TestView1 = Z.View.extend(function() {
  this.def('render', function() {
    this.node.innerHTML = '<div class="test-view-1"></div>';
  });
});

TestView2 = Z.View.extend(function() {
  this.def('render', function() {
    this.node.innerHTML = '<div class="test-view-2"></div>';
  });
});

TestView3 = Z.View.extend(function() {
  this.def('render', function() {
    this.node.innerHTML = '<div class="test-view-3"></div>';
  });
});

TestCompoundView = Z.View.extend();

describe('Z.View', function() {
  describe('node property', function() {
    it('should create a detached empty DOM node', function() {
      var v = TestView1.create(), node = v.node;

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

      expect(v.node.className.match(/foo/)).toBeTruthy();
      expect(v.node.className.match(/bar/)).toBeTruthy();
    });
  });

  describe('.forNode', function() {
    it('should return the `Z.View` object that owns the node', function() {
      var v1 = TestView1.create(), v2 = TestView2.create();

      expect(Z.View.forNode(document.body)).toBeNull();
      expect(Z.View.forNode(v1.node)).toBe(v1);
      expect(Z.View.forNode(v2.node)).toBe(v2);
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

    it('should remove the view from the cache that `forNode` uses', function() {
      var v = TestCompoundView.create();

      expect(Z.View.forNode(v.node)).toBe(v);
      v.destroy();
      expect(Z.View.forNode(v.node)).toBeNull();
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

    it("should set the subview's `window` property to the receiver's `window` property", function() {
      var w = Z.Window.create(v);

      expect(v.window()).toBe(w);
      expect(sv1.window()).toBeNull();
      v.addSubview(sv1);
      expect(sv1.window()).toBe(w);
    });

    it('should set the `window` property on each view in the subview tree', function() {
      var w = Z.Window.create(v), sv1, sv2, sv3, sv4;

      sv1 = Z.View.create();
      sv2 = Z.View.create();
      sv3 = Z.View.create();
      sv4 = Z.View.create();

      sv1.addSubview(sv2);
      sv1.addSubview(sv3);
      sv2.addSubview(sv4);

      expect(v.window()).toBe(w);
      expect(sv1.window()).toBeNull();
      expect(sv2.window()).toBeNull();
      expect(sv3.window()).toBeNull();
      expect(sv4.window()).toBeNull();

      v.addSubview(sv1);

      expect(sv1.window()).toBe(w);
      expect(sv2.window()).toBe(w);
      expect(sv3.window()).toBe(w);
      expect(sv4.window()).toBe(w);
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

      expect(v.node.querySelector('.test-view-1')).toEqual(null);
      v.display();
      expect(v.node.querySelector('.test-view-1')).not.toEqual(null);
    });

    it('should invoke the `update` method if it exists and the view has already been rendered', function() {
      var v = TestView1.create();

      v.def('update', function() {});

      spyOn(v, 'render').andCallThrough();
      spyOn(v, 'update').andCallThrough();

      v.display();
      expect(v.render.callCount).toBe(1);
      expect(v.update.callCount).toBe(0);

      v.display();
      expect(v.render.callCount).toBe(1);
      expect(v.update.callCount).toBe(1);
    });

    it('should render the subviews', function() {
      var v = TestCompoundView.create();

      v.addSubview(TestView1.create());
      v.addSubview(TestView2.create());

      expect(v.node.querySelector('.test-view-1')).toEqual(null);
      expect(v.node.querySelector('.test-view-2')).toEqual(null);
      v.display();
      expect(v.node.querySelector('.test-view-1')).not.toEqual(null);
      expect(v.node.querySelector('.test-view-2')).not.toEqual(null);
    });

    it('should render and attach subview nodes for subviews added since the last time `display` was called', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create(),
          sv3 = TestView3.create();

      v.addSubview(sv1);
      v.display();

      expect(slice.call(v.node.childNodes)).toEq([sv1.node]);
      v.addSubview(sv2);
      expect(slice.call(v.node.childNodes)).toEq([sv1.node]);
      v.display();
      expect(slice.call(v.node.childNodes)).toEq([sv1.node, sv2.node]);
      v.addSubview(sv3, 0);
      expect(slice.call(v.node.childNodes)).toEq([sv1.node, sv2.node]);
      v.display();
      expect(slice.call(v.node.childNodes)).toEq([sv3.node, sv1.node, sv2.node]);
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

      expect(slice.call(v.node.childNodes)).toEq([sv1.node, sv2.node, sv3.node]);
      sv2.remove();
      expect(slice.call(v.node.childNodes)).toEq([sv1.node, sv2.node, sv3.node]);
      v.display();
      expect(slice.call(v.node.childNodes)).toEq([sv1.node, sv3.node]);
      v.removeSubview(sv1);
      expect(slice.call(v.node.childNodes)).toEq([sv1.node, sv3.node]);
      v.display();
      expect(slice.call(v.node.childNodes)).toEq([sv3.node]);
      v.removeSubview(sv3);
      expect(slice.call(v.node.childNodes)).toEq([sv3.node]);
      v.display();
      expect(slice.call(v.node.childNodes)).toEq([]);
    });

    it('should replace subview nodes for subviews that were replaced since the last time `display` was called', function() {
      var v   = TestCompoundView.create(),
          sv1 = TestView1.create(),
          sv2 = TestView2.create(),
          sv3 = TestView3.create();

      v.addSubview(sv1);
      v.addSubview(sv2);
      v.display();

      expect(slice.call(v.node.childNodes)).toEq([sv1.node, sv2.node]);
      v.replaceSubview(sv1, sv3);
      expect(slice.call(v.node.childNodes)).toEq([sv1.node, sv2.node]);
      v.display();
      expect(slice.call(v.node.childNodes)).toEq([sv3.node, sv2.node]);
      v.replaceSubview(sv2, sv1);
      expect(slice.call(v.node.childNodes)).toEq([sv3.node, sv2.node]);
      v.display();
      expect(slice.call(v.node.childNodes)).toEq([sv3.node, sv1.node]);
    });

    it('should attach subview nodes to the node returned by the `subviewContainerNode` method', function() {
      var v, sv1, sv2, sv3;

      v = Z.View.extend(function() {
        this.def('render', function() {
          this.node.innerHTML = '<div class="header"></div><div class="body"></div><div class="footer"></div>';
        });

        this.def('subviewContainerNode', function() {
          return this.node.childNodes[1];
        });
      }).create();

      sv1 = TestView1.create();
      sv2 = TestView2.create();
      sv3 = TestView3.create();

      v.addSubview(sv1);
      v.display();
      expect(v.node.querySelector('.header')).not.toEqual(null);
      expect(v.node.querySelector('.body .test-view-1')).not.toEqual(null);
      expect(v.node.querySelector('.footer')).not.toEqual(null);
      expect(slice.call(v.node.childNodes[1].childNodes)).toEq([sv1.node]);

      v.addSubview(sv2);
      v.display();
      expect(v.node.querySelector('.header')).not.toEqual(null);
      expect(v.node.querySelector('.body .test-view-2')).not.toEqual(null);
      expect(v.node.querySelector('.footer')).not.toEqual(null);
      expect(slice.call(v.node.childNodes[1].childNodes)).toEq([sv1.node, sv2.node]);

      v.addSubview(sv3);
      v.display();
      expect(v.node.querySelector('.header')).not.toEqual(null);
      expect(v.node.querySelector('.body .test-view-3')).not.toEqual(null);
      expect(v.node.querySelector('.footer')).not.toEqual(null);
      expect(slice.call(v.node.childNodes[1].childNodes)).toEq([sv1.node, sv2.node, sv3.node]);
    });

    it('should detach subview nodes from the node returned by the `subviewContainerNode` method', function() {
      var v, sv1, sv2, sv3;

      v = Z.View.extend(function() {
        this.def('render', function() {
          this.node.innerHTML = '<div class="header"></div><div class="body"></div><div class="footer"></div>';
        });

        this.def('subviewContainerNode', function() {
          return this.node.childNodes[1];
        });
      }).create();

      sv1 = TestView1.create();
      sv2 = TestView2.create();
      sv3 = TestView3.create();

      v.addSubview(sv1);
      v.addSubview(sv2);
      v.addSubview(sv3);
      v.display();

      expect(v.node.querySelector('.header')).not.toEqual(null);
      expect(v.node.querySelector('.footer')).not.toEqual(null);
      expect(slice.call(v.node.childNodes[1].childNodes)).toEq([sv1.node, sv2.node, sv3.node]);

      v.removeSubview(sv2);
      v.display();
      expect(v.node.querySelector('.header')).not.toEqual(null);
      expect(v.node.querySelector('.footer')).not.toEqual(null);
      expect(slice.call(v.node.childNodes[1].childNodes)).toEq([sv1.node, sv3.node]);

      v.removeSubview(sv1);
      v.display();
      expect(v.node.querySelector('.header')).not.toEqual(null);
      expect(v.node.querySelector('.footer')).not.toEqual(null);
      expect(slice.call(v.node.childNodes[1].childNodes)).toEq([sv3.node]);

      v.removeSubview(sv3);
      v.display();
      expect(v.node.querySelector('.header')).not.toEqual(null);
      expect(v.node.querySelector('.footer')).not.toEqual(null);
      expect(slice.call(v.node.childNodes[1].childNodes)).toEq([]);
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

  describe('.init with subviews defined by `.subview`', function() {
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

  describe('key view loop', function() {
    var V = TestCompoundView.extend(function() {
      this.subview('sv1', TestView1.extend(function() {
        this.def('nextKeyView', function() { return this.get('superview.sv2'); });
        this.def('previousKeyView', function() { return this.get('superview.sv3'); });
      }));

      this.subview('sv2', TestView2.extend(function() {
        this.def('nextKeyView', function() { return this.get('superview.sv3'); });
        this.def('previousKeyView', function() { return this.get('superview.sv1'); });
      }));

      this.subview('sv3', TestView3.extend(function() {
        this.def('nextKeyView', function() { return this.get('superview.sv1'); });
        this.def('previousKeyView', function() { return this.get('superview.sv2'); });
      }));
    }), v;

    beforeEach(function() {
      v = V.create();
    });

    describe('.nextValidKeyView', function() {
      it('should return `null` when `nextKeyView` returns `null`', function() {
        v.sv1().nextKeyView = function() { return null; };

        expect(v.sv1().nextValidKeyView()).toBeNull();
      });

      it('should return `null` when no other key view accepts key view', function() {
        v.sv1().acceptsKeyView = function() { return true; };
        v.sv2().acceptsKeyView = function() { return false; };
        v.sv3().acceptsKeyView = function() { return false; };

        expect(v.sv1().nextValidKeyView()).toBeNull();
      });

      it('should return the next key view that accepts key view', function() {
        v.sv1().acceptsKeyView = function() { return true; };
        v.sv2().acceptsKeyView = function() { return false; };
        v.sv3().acceptsKeyView = function() { return true; };

        expect(v.sv1().nextValidKeyView()).toBe(v.sv3());
      });
    });

    describe('.previousValidKeyView', function() {
      it('should return `null` when `previousKeyView` returns `null`', function() {
        v.sv1().prevKeyView = function() { return null; };

        expect(v.sv1().previousValidKeyView()).toBeNull();
      });

      it('should return `null` when no other key view accepts key view', function() {
        v.sv1().acceptsKeyView = function() { return true; };
        v.sv2().acceptsKeyView = function() { return false; };
        v.sv3().acceptsKeyView = function() { return false; };

        expect(v.sv1().previousValidKeyView()).toBeNull();
      });

      it('should return the previous key view that accepts key view', function() {
        v.sv1().acceptsKeyView = function() { return true; };
        v.sv2().acceptsKeyView = function() { return true; };
        v.sv3().acceptsKeyView = function() { return false; };

        expect(v.sv1().previousValidKeyView()).toBe(v.sv2());
      });
    });
  });

  describe('.send', function() {
    it('should send the action up the superview chain until a view implements the action and returns a truthy value', function() {
      var a = Z.View.create(),
          b = Z.View.create(),
          c = Z.View.create(),
          d = Z.View.create();

      a.def('someAction', function() {});
      b.def('someAction', function() { return 1; });
      d.def('someAction', function() {});

      spyOn(a, 'someAction').andCallThrough();
      spyOn(b, 'someAction').andCallThrough();
      spyOn(d, 'someAction').andCallThrough();

      a.addSubview(b);
      b.addSubview(c);
      c.addSubview(d);

      d.send('someAction', 1, 2);

      expect(d.someAction).toHaveBeenCalledWith(1, 2);
      expect(b.someAction).toHaveBeenCalledWith(1, 2);
      expect(a.someAction).not.toHaveBeenCalled();
    });

    it("should send the action to each view's delegate object if it exists and responds to the action", function() {
      var a = Z.View.create({delegate: Z.Object.create()}),
          b = Z.View.create({delegate: Z.Object.create()}),
          c = Z.View.create({delegate: Z.Object.create()}),
          d = Z.View.create({delegate: Z.Object.create()});

      a.delegate().def('someAction', function() {});
      b.delegate().def('someAction', function() { return true; });
      d.delegate().def('someAction', function() {});

      spyOn(a.delegate(), 'someAction').andCallThrough();
      spyOn(b.delegate(), 'someAction').andCallThrough();
      spyOn(d.delegate(), 'someAction').andCallThrough();

      a.addSubview(b);
      b.addSubview(c);
      c.addSubview(d);

      d.send('someAction', 1, 2);

      expect(d.delegate().someAction).toHaveBeenCalledWith(1, 2);
      expect(b.delegate().someAction).toHaveBeenCalledWith(1, 2);
      expect(a.delegate().someAction).not.toHaveBeenCalled();
    });

    it("should send the action to each view's delegate via the `send` method if the delegate doesn't implement the action but does implement `send`", function() {
      var a = Z.View.create({delegate: Z.Object.create()}),
          b = Z.View.create(),
          c = Z.View.create(),
          d = Z.View.create();

      a.delegate().def('send', function() {});

      spyOn(a.delegate(), 'send');

      a.addSubview(b);
      b.addSubview(c);
      c.addSubview(d);

      d.send('someAction', 1, 2);
      expect(a.delegate().send).toHaveBeenCalledWith('someAction', 1, 2);
    });
  });

  describe('.each', function() {
    it("should yield each view in the receiver's hierarchy", function() {
      var v1   = TestCompoundView.create(),
          v11  = TestCompoundView.create(),
          v12  = TestCompoundView.create(),
          v13  = TestCompoundView.create(),
          v121 = TestCompoundView.create(),
          v122 = TestCompoundView.create(),
          v131 = TestCompoundView.create(),
          test = Z.A();

      v1.addSubview(v11);
      v1.addSubview(v12);
      v1.addSubview(v13)
      v12.addSubview(v121);
      v12.addSubview(v122);
      v13.addSubview(v131);

      v1.each(function(v) { test.push(v); });

      expect(test).toEq(Z.A(v1, v11, v12, v121, v122, v13, v131));
    });
  });
});

}());

