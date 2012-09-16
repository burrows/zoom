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

  describe('.path', function() {
    it('should return an array of of state names leading up to, but not including the root state', function() {
      var a = Z.State.create('a'),
          b = Z.State.create('b'),
          c = Z.State.create('c'),
          d = Z.State.create('d');

      expect(a.path()).toEq([]);
      expect(b.path()).toEq([]);
      expect(c.path()).toEq([]);
      expect(d.path()).toEq([]);

      b.addSubstate(c);
      b.addSubstate(d);

      expect(a.path()).toEq([]);
      expect(b.path()).toEq([]);
      expect(c.path()).toEq(['c']);
      expect(d.path()).toEq(['d']);

      a.addSubstate(b);

      expect(a.path()).toEq([]);
      expect(b.path()).toEq(['b']);
      expect(c.path()).toEq(['b', 'c']);
      expect(d.path()).toEq(['b', 'd']);
    });
  });

  describe('.enter on a clustered state', function() {
    var s, s1, s2, s3;

    beforeEach(function() {
      s  = Z.State.create('s');
      s1 = Z.State.create('s1');
      s2 = Z.State.create('s2');
      s3 = Z.State.create('s3');

      s.addSubstate(s1);
      s.addSubstate(s2);
      s.addSubstate(s3);
    });

    it('should throw an exception when given a destination path whose head is not a substate', function() {
      expect(function() {
        s.enter([['x']]);
      }).toThrow(Z.fmt("Z.State.enter: state %@ has no substate named 'x'", s));
    });

    it('should throw an exception when given multiple destination paths whose heads are not the same', function() {
      expect(function() {
        s.enter([['s1'], ['s2'], ['s1']]);
      }).toThrow(Z.fmt("Z.State.enter: state %@ given destination paths with inconsistent heads: %@", s, ['s1', 's2', 's1']));
    });

    it('should set `isCurrent` to `true`', function() {
      expect(s1.isCurrent).toBe(false);
      s1.enter([]);
      expect(s1.isCurrent).toBe(true);
    });

    it('should call `didEnterState` on the receiver when its not already current', function() {
      spyOn(s1, 'didEnterState');
      s1.enter([]);
      expect(s1.didEnterState).toHaveBeenCalled();
    });

    it('should not call `didEnterState` on the receiver when it is already current', function() {
      s1.enter([]);
      spyOn(s1, 'didEnterState');
      s1.enter([]);
      expect(s1.didEnterState).not.toHaveBeenCalled();
    });

    it('should call `enter` on the given next substate', function() {
      spyOn(s2, 'enter');
      s.enter([['s2']]);
      expect(s2.enter).toHaveBeenCalled();
      expect(s2.enter.argsForCall[0][0]).toEq([[]]);
    });

    it('should call `enter` on the first substate when a destination path is not given', function() {
      spyOn(s1, 'enter');
      s.enter([]);
      expect(s1.enter).toHaveBeenCalled();
    });

    it('should call `exit` on the current substate when it is different than the substate being entered', function() {
      s.enter([['s3']]);
      spyOn(s3, 'exit');
      s.enter([['s2']]);
      expect(s3.exit).toHaveBeenCalled();
    });
  });

  describe('.enter on a concurrent state', function() {
    var s, s1, s2, s3;

    beforeEach(function() {
      s  = Z.State.create('s', {isConcurrent: true});
      s1 = Z.State.create('s1');
      s2 = Z.State.create('s2');
      s3 = Z.State.create('s3');

      s.addSubstate(s1);
      s.addSubstate(s2);
      s.addSubstate(s3);
    });

    it('should throw an exception when given a destination path whose head is not a substate', function() {
      expect(function() {
        s.enter([['x']]);
      }).toThrow(Z.fmt("Z.State.enter: state %@ has no substate named 'x'", s));
    });

    it('should set `isCurrent` to `true`', function() {
      expect(s.isCurrent).toBe(false);
      s.enter([]);
      expect(s.isCurrent).toBe(true);
    });

    it('should call `didEnterState` on the receiver when it is not already current', function() {
      spyOn(s, 'didEnterState');
      s.enter([]);
      expect(s.didEnterState).toHaveBeenCalled();
    });

    it('should not call `didEnterState` on the receiver when it is already current', function() {
      s.enter([]);
      spyOn(s, 'didEnterState');
      s.enter([]);
      expect(s.didEnterState).not.toHaveBeenCalled();
    });

    it('should call `enter` on each substate', function() {
      spyOn(s1, 'enter');
      spyOn(s2, 'enter');
      spyOn(s3, 'enter');
      s.enter([]);
      expect(s1.enter).toHaveBeenCalled();
      expect(s2.enter).toHaveBeenCalled();
      expect(s3.enter).toHaveBeenCalled();
    });

    it('should pass along the destination paths that belong to the corresponding concurrent substate when calling `enter` on the substate', function() {
      spyOn(s1, 'enter');
      spyOn(s2, 'enter');
      spyOn(s3, 'enter');
      s.enter([['s1', 'a'], ['s2', 'b'], ['s3', 'c']]);
      expect(s1.enter).toHaveBeenCalled();
      expect(s1.enter.argsForCall[0][0]).toEq([['a']]);
      expect(s2.enter).toHaveBeenCalled();
      expect(s2.enter.argsForCall[0][0]).toEq([['b']]);
      expect(s3.enter).toHaveBeenCalled();
      expect(s3.enter.argsForCall[0][0]).toEq([['c']]);
    });
  });

  describe('.exit on a clustered state', function() {
    var s, s1, s2, s3;

    beforeEach(function() {
      s  = Z.State.create('s');
      s1 = Z.State.create('s1');
      s2 = Z.State.create('s2');
      s3 = Z.State.create('s3');

      s.addSubstate(s1);
      s.addSubstate(s2);
      s.addSubstate(s3);
    });

    it('should throw an exception if the state is not current', function() {
      expect(s.isCurrent).toBe(false);
      expect(function() {
        s.exit();
      }).toThrow(Z.fmt("Z.State.exit: state %@ is not current", s));
    });

    it('should set `isCurrent` to false', function() {
      s1.enter([]);
      expect(s1.isCurrent).toBe(true);
      s1.exit();
      expect(s1.isCurrent).toBe(false);
    });

    it('should call `willExitState` on the receiver', function() {
      s1.enter([]);
      spyOn(s1, 'willExitState');
      s1.exit();
      expect(s1.willExitState).toHaveBeenCalled();
    });

    it('should call `exit` on the current substate', function() {
      s.enter([['s3']]);
      spyOn(s3, 'exit');
      s.exit();
      expect(s3.exit).toHaveBeenCalled();
    });
  });

  describe('.exit on a concurrent state', function() {
    var s, s1, s2, s3;

    beforeEach(function() {
      s  = Z.State.create('s', {isConcurrent: true});
      s1 = Z.State.create('s1');
      s2 = Z.State.create('s2');
      s3 = Z.State.create('s3');

      s.addSubstate(s1);
      s.addSubstate(s2);
      s.addSubstate(s3);
    });

    it('should throw an exception if the state is not current', function() {
      expect(s.isCurrent).toBe(false);
      expect(function() {
        s.exit();
      }).toThrow(Z.fmt("Z.State.exit: state %@ is not current", s));
    });

    it('should set `isCurrent` to false', function() {
      s.enter([]);
      expect(s.isCurrent).toBe(true);
      s.exit();
      expect(s.isCurrent).toBe(false);
    });

    it('should call `willExitState` on the receiver', function() {
      s.enter([]);
      spyOn(s, 'willExitState');
      s.exit();
      expect(s.willExitState).toHaveBeenCalled();
    });

    it('should call `exit` on all substates', function() {
      s.enter([]);
      spyOn(s1, 'exit');
      spyOn(s2, 'exit');
      spyOn(s3, 'exit');
      s.exit();
      expect(s1.exit).toHaveBeenCalled();
      expect(s2.exit).toHaveBeenCalled();
      expect(s3.exit).toHaveBeenCalled();
    });
  });

  describe('.current', function() {
    var s, s1, s2, s11, s12, s21, s22;

    beforeEach(function() {
      s   = Z.State.create('s', {isConcurrent: true});
      s1  = Z.State.create('s1');
      s2  = Z.State.create('s2');
      s11 = Z.State.create('s11');
      s12 = Z.State.create('s12');
      s21 = Z.State.create('s21');
      s22 = Z.State.create('s22');

      s.addSubstate(s1);
      s.addSubstate(s2);
      s1.addSubstate(s11);
      s1.addSubstate(s12);
      s2.addSubstate(s21);
      s2.addSubstate(s22);
    });

    it('should return `null` when the state is not current', function() {
      expect(s.isCurrent).toBe(false);
      expect(s.current()).toBeNull();
    });

    it('should return an array of all current leaf states', function() {
      s.enter([['s1', 's11'], ['s2', 's22']]);
      expect(s.current()).toEq([s11, s22]);
    });
  });

  describe('.root', function() {
    it('should return the root state', function() {
      var s   = Z.State.create('s'),
          s1  = Z.State.create('s1'),
          s2  = Z.State.create('s2'),
          s11 = Z.State.create('s11'),
          s12 = Z.State.create('s12');

      s.addSubstate(s1);
      s.addSubstate(s2);
      s1.addSubstate(s11);
      s1.addSubstate(s12);

      expect(s.root()).toBe(s);
      expect(s1.root()).toBe(s);
      expect(s2.root()).toBe(s);
      expect(s11.root()).toBe(s);
      expect(s12.root()).toBe(s);
    });
  });

  describe('.goto', function() {
    var root, a, b, c, d, e, f, g, h, i, j, k, l, m;

    beforeEach(function() {
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
    });

    it('should raise an exception when the receiver state is not current', function() {
      expect(function() {
        c.goto('a.b.d');
      }).toThrow(Z.fmt("Z.State.goto: state %@ is not current", c));
    });

    it('should raise an exception when multiple pivot states are found between the receiver and the given destination paths', function() {
      root.enter([['a', 'b', 'c']]);

      expect(function() {
        c.goto('a.b.d', 'a.e.f');
      }).toThrow(Z.fmt("Z.State.goto: multiple pivot states found between state %@ and paths a.b.d, a.e.f", c));
    });

    it('should raise an exception if any given destination state is not reachable from the receiver', function() {
      root.enter([['a', 'e', 'g', 'h', 'i']]);
      expect(function() {
        i.goto('a.e.g.k.l');
      }).toThrow(Z.fmt("Z.State.goto: path 'a.e.g.k.l' is not reachable from state %@", i));
    });

    it("should invoke `enter` on the pivot state with the pivot state's path trimmed from the destination paths", function() {
      root.enter([['a', 'e', 'f']]);
      spyOn(e, 'enter');
      f.goto('a.e.g.h.j', 'a.e.g.k.m');
      expect(e.enter).toHaveBeenCalledWith([['g', 'h', 'j'], ['g', 'k', 'm']]);
    });

    it('should not affect the states in concurrent superstates', function() {
      root.enter([['a', 'e', 'g', 'h', 'j'], ['a', 'e', 'g', 'k', 'm']]);
      expect(root.currentPaths()).toEq([['a', 'e', 'g', 'h', 'j'], ['a', 'e', 'g', 'k', 'm']]);
      m.goto('a.e.g.k.l');
      expect(root.currentPaths()).toEq([['a', 'e', 'g', 'h', 'j'], ['a', 'e', 'g', 'k', 'l']]);
    });
  });
});

}());
