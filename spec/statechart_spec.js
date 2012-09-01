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

  describe('.isRoot', function() {
    it('should return true if the state has no superstate and false otherwise', function() {
      var s = Z.BaseState.create('s'), s1 = Z.BaseState.create('s1');
      s.addSubstate(s1);
      expect(s.isRoot()).toBe(true);
      expect(s1.isRoot()).toBe(false);
    });
  });

  describe('.root', function() {
    it('should return the root state', function() {
      var a = Z.BaseState.create('a'),
          b = Z.BaseState.create('b'),
          c = Z.BaseState.create('c');
          d = Z.BaseState.create('d');

      a.addSubstate(b);
      a.addSubstate(c);
      c.addSubstate(d);

      expect(a.root()).toBe(a);
      expect(b.root()).toBe(a);
      expect(c.root()).toBe(a);
      expect(d.root()).toBe(a);
    });
  });

  describe('.path', function() {
    it("should return an array containing the the path of states starting from the root to the receiver", function() {
      var a = Z.BaseState.create('a'),
          b = Z.BaseState.create('b'),
          c = Z.BaseState.create('c'),
          d = Z.BaseState.create('d');

      a.addSubstate(b);
      b.addSubstate(c);
      b.addSubstate(d);

      expect(a.path()).toEq(Z.A(a));
      expect(b.path()).toEq(Z.A(a, b));
      expect(c.path()).toEq(Z.A(a, b, c));
      expect(d.path()).toEq(Z.A(a, b, d));
    });
  });

  describe('.transisitionStates', function() {
    var s, s1, s2, s3, s11, s12, s31, s32;

    beforeEach(function() {
      s   = Z.BaseState.create('s');
      s1  = Z.BaseState.create('s1');
      s2  = Z.BaseState.create('s2');
      s3  = Z.BaseState.create('s3');
      s11 = Z.BaseState.create('s11');
      s12 = Z.BaseState.create('s12');
      s31 = Z.BaseState.create('s31');
      s32 = Z.BaseState.create('s32');

      s.addSubstate(s1);
      s.addSubstate(s2);
      s.addSubstate(s3);
      s1.addSubstate(s11);
      s1.addSubstate(s12);
      s3.addSubstate(s31);
      s3.addSubstate(s32);
    });

    it('should throw an exception when the receiver and given state do not belong to the same tree', function() {
      var x = Z.BaseState.create('x');

      expect(function() {
        s1.transitionStates(x);
      }).toThrow(Z.fmt("Z.BaseState.transitionStates: states %@ and %@ do not belong to the same statechart", s1, x));
    });

    it('should throw an exception when the receiver and given state are the same', function() {
      expect(function() {
        s1.transitionStates(s1);
      }).toThrow(Z.fmt("Z.BaseState.transitionStates: start and end states are the same: %@", s1));
    });

    it('should return a tuple containing the pivot state, exit root state, and enter root state', function() {
      expect(s11.transitionStates(s12)).toEq([s1, s11, s12]);
      expect(s11.transitionStates(s31)).toEq([s, s1, s3]);
      expect(s32.transitionStates(s2)).toEq([s, s3, s2]);
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

  describe('.currentStates', function() {
    var s, s1, s2, s11, s12;

    beforeEach(function() {
      s   = Z.State.create('s');
      s1  = Z.State.create('s1');
      s2  = Z.State.create('s2');
      s11 = Z.State.create('s11');
      s12 = Z.State.create('s12');

      s.addSubstate(s1);
      s.addSubstate(s2);
      s1.addSubstate(s11);
      s1.addSubstate(s12);
    });

    it('should return `null` when the state is not current', function() {
      expect(s.isCurrent).toBe(false);
      expect(s.currentStates()).toBeNull();
    });

    it('should return a `Z.Array` containing the result of invoking `currentStates` on the current substate with the name of the receiver prepended to each path', function() {
      s.enter(Z.A(Z.A('s1', 's12')));
      expect(s.currentStates()).toEq(Z.A(Z.A('s', 's1', 's12')));

      spyOn(s1, 'currentStates').andCallFake(function() {
        return Z.A(Z.A('a', 'b'), Z.A('c', 'd'));
      });

      expect(s.currentStates()).toEq(Z.A(Z.A('s', 'a', 'b'), Z.A('s', 'c', 'd')));
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

    it('should throw an exception if the state is already current', function() {
      s.enter(Z.A());
      expect(function() {
        s.enter(Z.A());
      }).toThrow(Z.fmt("Z.ConcurrentState.enter: state %@ is already current", s));
    });

    it('should throw an exception when given a destination path whose head is not a substate', function() {
      expect(function() {
        s.enter(Z.A(Z.A('x', 'y', 'z')));
      }).toThrow(Z.fmt("Z.ConcurrentState.enter: state %@ has no substate named 'x'", s));
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

  describe('.exit', function() {
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

    it('should throw an exception if the state is not current', function() {
      expect(s.isCurrent).toBe(false);
      expect(function() {
        s.exit();
      }).toThrow(Z.fmt("Z.ConcurrentState.exit: state %@ is not current", s));
    });

    it('should set `isCurrent` to false', function() {
      s.enter(Z.A());
      expect(s.isCurrent).toBe(true);
      s.exit();
      expect(s.isCurrent).toBe(false);
    });

    it('should call `willExitState` on the receiver', function() {
      s.enter(Z.A());
      spyOn(s, 'willExitState');
      s.exit();
      expect(s.willExitState).toHaveBeenCalled();
    });

    it('should call `exit` on all substates and then call `willExitState` on the receiver', function() {
      s.enter(Z.A());
      spyOn(s, 'willExitState');
      spyOn(s1, 'exit');
      spyOn(s2, 'exit');
      spyOn(s3, 'exit');
      s.exit();
      expect(s1.exit).toHaveBeenCalled();
      expect(s2.exit).toHaveBeenCalled();
      expect(s3.exit).toHaveBeenCalled();
      expect(s.willExitState).toHaveBeenCalled();
    });
  });

  describe('.currentStates', function() {
    var s, s1, s2, s11, s12, s21, s22;

    beforeEach(function() {
      s   = Z.ConcurrentState.create('s');
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
      expect(s.currentStates()).toBeNull();
    });

    it('should return a `Z.Array` containing the result of invokeing `currentStates` on each substate with the name of the receiver prepended to each path', function() {
      s.enter(Z.A(Z.A('s1', 's11'), Z.A('s2', 's22')));
      expect(s.currentStates()).toEq(Z.A(Z.A('s', 's1', 's11'), Z.A('s', 's2', 's22')));
    });
  });
});

}());
