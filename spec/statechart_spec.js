(function() {

if (!this.Z) { require('./helper'); }

describe('Z.BaseState', function() {
  describe('.init', function() {
    it('should set the `name` property', function() {
      var s = Z.BaseState.create('a');
      expect(s.name).toBe('a');
    });

    it('should set substates property to an empty hash', function() {
      var s = Z.BaseState.create('a');
      expect(s.substates).toEq(Z.H());
    });
  });

  describe('.addSubstate', function() {
    it('should add the given state to the substates hash', function() {
      var a = Z.BaseState.create('a'),
          b = Z.BaseState.create('b'),
          c = Z.BaseState.create('c');

      a.addSubstate(b);
      expect(a.substates).toEq(Z.H('b', b));
      a.addSubstate(c);
      expect(a.substates).toEq(Z.H('b', b, 'c', c));
    });

    it('should set the superstate property of the given state', function() {
      var a = Z.BaseState.create('a'),
          b = Z.BaseState.create('b'),
          c = Z.BaseState.create('c');

      a.addSubstate(b);
      expect(b.superstate).toBe(a);
      a.addSubstate(c);
      expect(c.superstate).toBe(a);
    });
  });

  describe('.ancestorStates', function() {
    it("should return an array of the given state's ancestor states", function() {
      var a = Z.BaseState.create('a'),
          b = Z.BaseState.create('b'),
          c = Z.BaseState.create('c'),
          d = Z.BaseState.create('d');

      a.addSubstate(b);
      b.addSubstate(c);
      b.addSubstate(d);

      expect(a.ancestorStates()).toEq([a]);
      expect(b.ancestorStates()).toEq([b, a]);
      expect(c.ancestorStates()).toEq([c, b, a]);
      expect(d.ancestorStates()).toEq([d, b, a]);
    });
  });

  describe('.commonAncestor', function() {
    it('should throw an exception if the given state is not in the same tree', function() {
      var a = Z.BaseState.create('a'), b = Z.BaseState.create('b');

      expect(function() {
        a.commonAncestor(b);
      }).toThrow(Z.fmt("Z.BaseState.commonAncestor: state %@ does not belong to the same statechart as state %@", a, b));
    });

    it('should return the first common ancestor state among the receiver and given state', function() {
      var a = Z.BaseState.create('a'),
          b = Z.BaseState.create('b'),
          c = Z.BaseState.create('c'),
          d = Z.BaseState.create('d'),
          e = Z.BaseState.create('e');

      a.addSubstate(b);
      a.addSubstate(c);
      b.addSubstate(d);
      b.addSubstate(e);

      expect(d.commonAncestor(e)).toBe(b);
      expect(d.commonAncestor(b)).toBe(b);
      expect(e.commonAncestor(b)).toBe(b);
      expect(d.commonAncestor(c)).toBe(a);
    });
  });
});

describe('Z.State', function() {
  describe('.enter', function() {
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

    it('should throw an exception if the state is already current', function() {
      s1.enter(Z.A());
      expect(function() {
        s1.enter(Z.A());
      }).toThrow(Z.fmt("Z.State.enter: state %@ is already current", s1));
    });

    it('should throw an exception when given a destination path whose head is not a substate', function() {
      expect(function() {
        s.enter(Z.A(Z.A('x', 'y', 'z')));
      }).toThrow(Z.fmt("Z.State.enter: state %@ has no substate named 'x'", s));
    });

    it('should throw an exception when given multiple destination paths whose heads are not the same', function() {
      var paths = Z.A(Z.A('x', 'y'), Z.A('x', 'z'), Z.A('m', 'n'));
      expect(function() {
        s.enter(paths);
      }).toThrow(Z.fmt("Z.State.enter: state %@ given destination paths with inconsistent heads: %@", s, ['x', 'x', 'm']));
    });

    it('should set `isCurrent` to `true`', function() {
      expect(s1.isCurrent).toBe(false);
      s1.enter(Z.A());
      expect(s1.isCurrent).toBe(true);
    });

    it('should call `didEnterState` on the receiver', function() {
      spyOn(s1, 'didEnterState');
      s1.enter(Z.A());
      expect(s1.didEnterState).toHaveBeenCalled();
    });

    it('should call `didEnterState` on the receiver and then call `enter` on the given next substate', function() {
      spyOn(s, 'didEnterState');
      spyOn(s2, 'enter');
      s.enter(Z.A(Z.A('s2')));
      expect(s.didEnterState).toHaveBeenCalled();
      expect(s2.enter).toHaveBeenCalled();
      expect(s2.enter.argsForCall[0][0]).toEq(Z.A(Z.A()));
    });

    it('should call `enter` on the first substate when a destination path is not given', function() {
      spyOn(s1, 'enter');
      s.enter(Z.A());
      expect(s1.enter).toHaveBeenCalled();
    });
  });

  describe('.exit', function() {
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
      s1.enter(Z.A());
      expect(s1.isCurrent).toBe(true);
      s1.exit();
      expect(s1.isCurrent).toBe(false);
    });

    it('should call `willExitState` on the receiver', function() {
      s1.enter(Z.A());
      spyOn(s1, 'willExitState');
      s1.exit();
      expect(s1.willExitState).toHaveBeenCalled();
    });

    it('should call `exit` on the current substate and then call `willExitState` on the receiver', function() {
      s.enter(Z.A(Z.A('s3')));
      spyOn(s, 'willExitState');
      spyOn(s3, 'exit');
      s.exit();
      expect(s.willExitState).toHaveBeenCalled();
      expect(s3.exit).toHaveBeenCalled();
    });
  });
});

describe('Z.ConcurrentState', function() {
  describe('.enter', function() {
    var s, s1, s2, s3;

    beforeEach(function() {
      s  = Z.ConcurrentState.create('s');
      s1 = Z.State.create('s1');
      s2 = Z.State.create('s2');
      s3 = Z.State.create('s3');

      s.addSubstate(s1);
      s.addSubstate(s2);
      s.addSubstate(s3);
    });

    it('should set `isCurrent` to `true`', function() {
      expect(s.isCurrent).toBe(false);
      s.enter(Z.A());
      expect(s.isCurrent).toBe(true);
    });

    it('should call `didEnterState` on the receiver', function() {
      spyOn(s, 'didEnterState');
      s.enter(Z.A());
      expect(s.didEnterState).toHaveBeenCalled();
    });

    it('should call `didEnterState` on the receiver and then call `enter` on each substate', function() {
      spyOn(s, 'didEnterState');
      spyOn(s1, 'enter');
      spyOn(s2, 'enter');
      spyOn(s3, 'enter');
      s.enter(Z.A());
      expect(s.didEnterState).toHaveBeenCalled();
      expect(s1.enter).toHaveBeenCalled();
      expect(s2.enter).toHaveBeenCalled();
      expect(s3.enter).toHaveBeenCalled();
    });

    it('should pass along the destination paths that belong to the corresponding concurrent substate when calling `enter` on the substate', function() {
      spyOn(s1, 'enter');
      spyOn(s2, 'enter');
      spyOn(s3, 'enter');
      s.enter(Z.A(Z.A('s1', 'a'), Z.A('s2', 'b'), Z.A('s3', 'c')));
      expect(s1.enter).toHaveBeenCalled();
      expect(s1.enter.argsForCall[0][0]).toEq(Z.A(Z.A('a')));
      expect(s2.enter).toHaveBeenCalled();
      expect(s2.enter.argsForCall[0][0]).toEq(Z.A(Z.A('b')));
      expect(s3.enter).toHaveBeenCalled();
      expect(s3.enter.argsForCall[0][0]).toEq(Z.A(Z.A('c')));
    });
  });
});

}());
