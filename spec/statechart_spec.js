(function() {

if (!this.Z) { require('./helper'); }

describe('Z.State', function() {
  describe('.init', function() {
    it('should set the `name` property', function() {
      var s = Z.State.create('a');
      expect(s.name).toBe('a');
    });

    it('should set substates property to an empty hash', function() {
      var s = Z.State.create('a');
      expect(s.substates).toEq(Z.H());
    });

    it('should set `isCurrent` to `false`', function() {
      var s = Z.State.create('a');
      expect(s.isCurrent).toBe(false);
    });

    it('should default `isConcurrent` to `false`', function() {
      var s = Z.State.create('a');
      expect(s.isConcurrent).toBe(false);
    });

    it('should allow setting `isConcurrent` to `true`', function() {
      var s = Z.State.create('a', {isConcurrent: true});
      expect(s.isConcurrent).toBe(true);
    });
  });

  describe('.addSubstate', function() {
    it('should add the given state to the substates hash', function() {
      var a = Z.State.create('a'),
          b = Z.State.create('b'),
          c = Z.State.create('c');

      a.addSubstate(b);
      expect(a.substates).toEq(Z.H('b', b));
      a.addSubstate(c);
      expect(a.substates).toEq(Z.H('b', b, 'c', c));
    });

    it('should set the superstate property of the given state', function() {
      var a = Z.State.create('a'),
          b = Z.State.create('b'),
          c = Z.State.create('c');

      a.addSubstate(b);
      expect(b.superstate).toBe(a);
      a.addSubstate(c);
      expect(c.superstate).toBe(a);
    });
  });

  describe('.root', function() {
    it('should return the root of the tree', function() {
      var a = Z.State.create('a'),
          b = Z.State.create('b'),
          c = Z.State.create('c');
          d = Z.State.create('d');

      a.addSubstate(b);
      a.addSubstate(c);
      c.addSubstate(d);
      expect(a.root()).toEq(a);;
      expect(b.root()).toEq(a);;
      expect(c.root()).toEq(a);;
      expect(d.root()).toEq(a);;
    });
  });

  describe('.path', function() {
    it('should return a string of dot separated state names leading up to, but not including the root state', function() {
      var a = Z.State.create('a'),
          b = Z.State.create('b'),
          c = Z.State.create('c'),
          d = Z.State.create('d');

      expect(a.path()).toEq('');
      expect(b.path()).toEq('');
      expect(c.path()).toEq('');
      expect(d.path()).toEq('');

      b.addSubstate(c);
      b.addSubstate(d);

      expect(a.path()).toEq('');
      expect(b.path()).toEq('');
      expect(c.path()).toEq('c');
      expect(d.path()).toEq('d');

      a.addSubstate(b);

      expect(a.path()).toEq('');
      expect(b.path()).toEq('b');
      expect(c.path()).toEq('b.c');
      expect(d.path()).toEq('b.d');
    });
  });

  describe('.current', function() {
    var root, s, s1, s2, s11, s12, s21, s22;

    beforeEach(function() {
      root = Z.State.create('root');
      s    = Z.State.create('s', {isConcurrent: true});
      s1   = Z.State.create('s1');
      s2   = Z.State.create('s2');
      s11  = Z.State.create('s11');
      s12  = Z.State.create('s12');
      s21  = Z.State.create('s21');
      s22  = Z.State.create('s22');

      root.addSubstate(s);
      s.addSubstate(s1);
      s.addSubstate(s2);
      s1.addSubstate(s11);
      s1.addSubstate(s12);
      s2.addSubstate(s21);
      s2.addSubstate(s22);

      root.goto();
    });

    it('should return `null` when the state is not current', function() {
      expect(s12.isCurrent).toBe(false);
      expect(s12.current()).toBeNull();
    });

    it('should return an array of all current leaf states', function() {
      root.goto('s.s1.s11', 's.s2.s22');
      expect(s.current()).toEq([s11, s22]);
    });
  });

  describe('.goto', function() {
    var enters, exits, root, a, b, c, d, e, f, g, h, i, j, k, l, m;

    beforeEach(function() {
      enters = [];
      exits  = [];

      root = Z.State.create('root');
      a    = Z.State.create('a');
      b    = Z.State.create('b');
      c    = Z.State.create('c');
      d    = Z.State.create('d');
      e    = Z.State.create('e');
      f    = Z.State.create('f');
      g    = Z.State.create('g', {isConcurrent: true});
      h    = Z.State.create('h');
      i    = Z.State.create('i');
      j    = Z.State.create('j');
      k    = Z.State.create('k');
      l    = Z.State.create('l');
      m    = Z.State.create('m');

      root.addSubstate(a);
      a.addSubstate(b);
      a.addSubstate(e);
      b.addSubstate(c);
      b.addSubstate(d);
      e.addSubstate(f);
      e.addSubstate(g);
      g.addSubstate(h);
      g.addSubstate(k);
      h.addSubstate(i);
      h.addSubstate(j);
      k.addSubstate(l);
      k.addSubstate(m);

      root.goto();

      Z.A(root, a, b, c, d, e, f, g, h, i, j, k, l, m).each(function(s) {
        s.def('didEnterState', function() { enters.push(this); });
        s.def('willExitState', function() { exits.push(this); });
      });
    });

    describe('on the root state', function() {
      it('should transition to all default states when no paths are given', function() {
        expect(root.currentPaths()).toEq(['a.b.c']);
      });

      it('should transition all current states to the given states', function() {
        root.goto('a.e.g.h.j', 'a.e.g.k.l');
        expect(root.currentPaths()).toEq(['a.e.g.h.j', 'a.e.g.k.l']);
        root.goto('a.b.d');
        expect(root.currentPaths()).toEq(['a.b.d']);
      });
    });

    it('should raise an exception when the receiver state is not current', function() {
      expect(function() {
        d.goto('a.e.f');
      }).toThrow(Z.fmt("Z.State.goto: state %@ is not current", d));
    });

    it('should raise an exception when multiple pivot states are found between the receiver and the given destination paths', function() {
      expect(function() {
        c.goto('a.b.d', 'a.e.f');
      }).toThrow(Z.fmt("Z.State.goto: multiple pivot states found between state %@ and paths a.b.d, a.e.f", c));
    });

    it('should raise an exception if any given destination state is not reachable from the receiver', function() {
      root.goto('a.e.g.h.i');
      expect(function() {
        i.goto('a.e.g.k.l');
      }).toThrow(Z.fmt("Z.State.goto: path 'a.e.g.k.l' is not reachable from state %@", i));
    });

    it('should raise an exception when given an invalid path', function() {
      expect(function() {
        c.goto('a.b.x');
      }).toThrow(Z.fmt("Z.State.resolvePath: state %@ has no substate named 'x'", b));
    });

    it('should raise an exception when given paths to multiple clustered states', function() {
      expect(function() {
        c.goto('a.e.f', 'a.e.g');
      }).toThrow(Z.fmt("Z.State.enterClustered: attempted to enter multiple substates of %@: f, g", e));
    });

    it('should exit the states leading up to the pivot state and enter the states leading to the destination states', function() {
      c.goto('a.e.f');
      expect(exits).toEq([c, b]);
      expect(enters).toEq([e, f]);

      exits  = [];
      enters = [];

      f.goto('a.e.g.h.i', 'a.e.g.k.m');
      expect(exits).toEq([f]);
      expect(enters).toEq([g, h, i, k, m]);
    });

    it('should set `isCurrent` to `true` on all states entered and to `false` on all states exited', function() {
      expect(a.isCurrent).toBe(true);
      expect(b.isCurrent).toBe(true);
      expect(c.isCurrent).toBe(true);
      expect(e.isCurrent).toBe(false);
      expect(f.isCurrent).toBe(false);

      c.goto('a.e.f');

      expect(a.isCurrent).toBe(true);
      expect(b.isCurrent).toBe(false);
      expect(c.isCurrent).toBe(false);
      expect(e.isCurrent).toBe(true);
      expect(f.isCurrent).toBe(true);
    });

    it('should enter the default substate when a path to a leaf state is not given', function() {
      c.goto('a.e.g');
      expect(enters).toEq([e, g, h, i, k, l]);
    });

    it('should exit all substates when a concurrent superstate is exited', function() {
      c.goto('a.e.g.h.j', 'a.e.g.k.l');

      exits  = [];
      enters = [];

      g.goto('a.b.d');

      expect(exits).toEq([j, h, l, k, g, e]);
    });

    it('should enter all substates when concurrent superstate is entered', function() {
      c.goto('a.e.g')
      expect(enters).toEq([e, g, h, i, k, l]);
    });

    it('should not affect the states in concurrent superstates', function() {
      c.goto('a.e.g.h.j', 'a.e.g.k.m');

      exits  = [];
      enters = [];

      m.goto('a.e.g.k.l');
      expect(exits).toEq([m]);
      expect(enters).toEq([l]);
    });
  });
});

}());
