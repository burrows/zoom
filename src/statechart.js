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

Z.State = Z.Object.extend(function() {
  this.def('init', function(name, opts) {
    this.name            = name;
    this.substates       = Z.H();
    this.superstate      = null;
    this.isCurrent       = false;
    this.currentSubstate = null;
  });

  this.def('addSubstate', function(state) {
    this.substates.at(state.name, state);
    state.superstate = this;
    return this;
  });

  this.def('ancestorStates', function() {
    var a = [this], s = this;
    while (s = s.superstate) { a.push(s); }
    return a;
  });

  this.def('commonAncestor', function(other) {
    var astates  = this.ancestorStates(),
        bstates  = other.ancestorStates(),
        mindepth = Z.min(astates.length, bstates.length),
        i, len;

    astates = astates.slice(astates.length - mindepth, astates.length);
    bstates = bstates.slice(bstates.length - mindepth, bstates.length);

    for (i = 0, len = astates.length; i < len; i++) {
      if (astates[i] === bstates[i]) { return astates[i]; }
    }

    throw new Error(Z.fmt("Z.State.commonAncestor: state %@ does not belong to the same statechart as state %@", this, other));
  });

  this.def('didEnterState', Z.identity);
  this.def('willExitState', Z.identity);

  this.def('enter', function(paths) {
    var heads = paths.invoke('shift'),
        next  = heads.first() || this.substates.keys().first();

    if (this.isCurrent) {
      throw new Error(Z.fmt("Z.State.enter: state %@ is already current", this));
    }

    if (heads.uniq().size() > 1) {
      throw new Error(Z.fmt("Z.State.enter: state %@ given destination paths with inconsistent heads: %@", this, heads.toNative()));
    }

    if (next && !this.substates.hasKey(next)) {
      throw new Error(Z.fmt("Z.State.enter: `%@` is not a substate of %@", next, this));
    }

    this.isCurrent = true;
    this.didEnterState();

    if (next) {
      this.currentSubstate = next;
      this.substates.at(next).enter(paths);
    }

    return this;
  });

  this.def('exit', function() {
    if (!this.isCurrent) {
      throw new Error(Z.fmt("Z.State.exit: state %@ is not current", this));
    }

    if (this.currentSubstate) {
      this.substates.at(this.currentSubstate).exit();
      this.currentSubstate = null;
    }

    this.willExitState();
    this.isCurrent = false;

    return this;
  });
});
