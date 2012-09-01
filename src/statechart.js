// Z.State
//   name - string
//   substates - hash
//   superstate - Z.State
//   historyState
//   resolve(string) - returns the state at the given path relative to the receiver
//   isCurrent
//   currentSubstates
//   currentStates
//   enter
//   exit
//   sendEvent(name) -
//   goto(state | states)

Z.BaseState = Z.Object.extend(function() {
  function pivot(path1, path2) {
    var s = null, i, len;

    for (i = 0, len = Z.min(path1.size(), path2.size()); i < len; i++) {
      if (path1.at(i) === path2.at(i)) { s = path1.at(i); }
      else { break; }
    }

    return s;
  }

  this.def('init', function(name) {
    this.name       = name;
    this.substates  = Z.H();
    this.superstate = null;
    this.isCurrent  = false;
  });

  this.def('addSubstate', function(state) {
    this.substates.at(state.name, state);
    state.superstate = this;
    return this;
  });

  this.def('path', function() {
    var a = Z.A(this), s = this;
    while (s = s.superstate) { a.unshift(s); }
    return a;
  });

  // Returns a tuple containing the pivot state, exit state, and enter state.
  this.def('transitionStates', function(end) {
    var startPath = this.path(),
        endPath   = end.path(),
        p         = pivot(startPath, endPath),
        i         = startPath.index(p);

    if (this === end) {
      throw new Error(Z.fmt("%@.transitionStates: start and end states are the same: %@", this.typeName(), this));
    }

    if (!p) {
      throw new Error(Z.fmt("%@.transitionStates: states %@ and %@ do not belong to the same statechart", this.typeName(), this, end));
    }

    return [p, startPath.at(i + 1), endPath.at(i + 1)];
  });

  this.def('didEnterState', Z.identity);

  this.def('willExitState', Z.identity);
});

Z.State = Z.BaseState.extend(function() {
  this.def('enter', function(paths) {
    var heads = paths.invoke('shift'),
        next  = heads.first() || this.substates.keys().first();

    if (this.isCurrent) {
      throw new Error(Z.fmt("%@.enter: state %@ is already current", this.typeName(), this));
    }

    if (heads.uniq().size() > 1) {
      throw new Error(Z.fmt("%@.enter: state %@ given destination paths with inconsistent heads: %@", this.typeName(), this, heads.toNative()));
    }

    if (next && !this.substates.hasKey(next)) {
      throw new Error(Z.fmt("%@.enter: state %@ has no substate named '%@'", this.typeName(), this, next));
    }

    this.isCurrent = true;
    this.didEnterState();

    if (next) { this.substates.at(next).enter(paths); }

    return this;
  });

  this.def('exit', function() {
    var substate = this.substates.values().find(function(s) {
      return s.isCurrent;
    });

    if (!this.isCurrent) {
      throw new Error(Z.fmt("%@.exit: state %@ is not current", this.typeName(), this));
    }

    if (substate) { substate.exit(); }

    this.willExitState();
    this.isCurrent = false;

    return this;
  });

  this.def('currentStates', function() {
    var name = this.name, substate, states;

    if (!this.isCurrent) { return null; }

    substate = this.substates.values().find(function(s) {
      return s.isCurrent;
    });

    if (!substate) { return Z.A(Z.A(name)); }

    states = substate.currentStates();

    states.each(function(state) { state.unshift(name); });

    return states;
  });
});

Z.ConcurrentState = Z.BaseState.extend(function() {
  this.def('enter', function(paths) {
    var self = this, substates = this.substates, pathsByHead;

    if (this.isCurrent) {
      throw new Error(Z.fmt("%@.enter: state %@ is already current", this.typeName(), this));
    }

    this.isCurrent = true;
    this.didEnterState();

    pathsByHead = paths.groupBy(function(p) { return p.shift(); });

    pathsByHead.keys().each(function(head) {
      if (substates.hasKey(head)) { return; }
      throw new Error(Z.fmt("%@.enter: state %@ has no substate named '%@'", self.typeName(), self, head));
    });

    substates.each(function(tuple) {
      tuple[1].enter(pathsByHead.at(tuple[0]) || Z.A());
    });

    return this;
  });

  this.def('exit', function() {
    if (!this.isCurrent) {
      throw new Error(Z.fmt("%@.exit: state %@ is not current", this.typeName(), this));
    }

    this.substates.values().invoke('exit');
    this.willExitState();
    this.isCurrent = false;

    return this;
  });

  this.def('currentStates', function() {
    var name = this.name, states = Z.A();

    if (!this.isCurrent) { return null; }

    this.substates.each(function(tuple) {
      tuple[1].currentStates().each(function(state) {
        states.push(state.unshift(name));
      });
    });

    return states;
  });
});
