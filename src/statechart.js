// Z.State
//   name         - string, set at init
//   isConcurrent - boolean, set at init
//   isCurrent    - boolean, set by enter/exit
//   substates    - hash mapping name to state object
//   superstate   - reference to parent
//   path         - array of state names, set during init, updated during addSubstate
//   current()    - traverse current states to leaf nodes, return list of leaf nodes
//   enter(paths) - enters the node, calls exit on current substate if its not on the path
//   exit()       - recursively exits the state bottom up
//   send(event)  -
// Z.Statechart
//   root - reference to root node
//   goto(states)
//   send(action)
//   current() - returns a list of string paths of current states

Z.State = Z.Object.extend(function() {
  function updatePath(state) {
    state.path = state.superstate.path.slice().concat([state.name]);
    state.substates.values().each(updatePath);
  }

  //function setRoot(state, root) {
  //  state.root = root;
  //  state.substates.values().each(function(state) { setRoot(state, root); });
  //}

  function enterClustered(paths) {
    var heads = [], cur, next, i, len;

    for (i = 0, len = paths.length; i < len; i++) {
      heads.push(paths[i].shift());
    }

    if (Z.Array.create(heads).uniq().size() > 1) {
      throw new Error(Z.fmt("Z.State.enter: state %@ given destination paths with inconsistent heads: %@", this, heads));
    }

    if (heads[0] && !this.substates.hasKey(heads[0])) {
      throw new Error(Z.fmt("Z.State.enter: state %@ has no substate named '%@'", this, heads[0]));
    }

    cur = this.substates.values().find(function(s) { return s.isCurrent; });

    if (this.substates.size() > 0) {
      next = heads[0] ? this.substates.at(heads[0]) : this.substates.first()[1];
    }

    if (cur && cur !== next) { cur.exit(); }

    if (!this.isCurrent) {
      this.isCurrent = true;
      this.didEnterState();
    }

    if (next) { next.enter(paths); }

    return this;
  }

  function enterConcurrent(paths) {
    var self = this, substates = this.substates, pathsByHead;

    if (!this.isCurrent) {
      this.isCurrent = true;
      this.didEnterState();
    }

    pathsByHead = Z.Array.create(paths).groupBy(function(p) { return p.shift(); });

    pathsByHead.keys().each(function(head) {
      if (substates.hasKey(head)) { return; }
      throw new Error(Z.fmt("Z.State.enter: state %@ has no substate named '%@'", self, head));
    });

    substates.each(function(tuple) {
      tuple[1].enter((pathsByHead.at(tuple[0]) || Z.A()).toNative());
    });

    return this;
  }

  function exitClustered() {
    var substate = this.substates.values().find(function(s) {
      return s.isCurrent;
    });

    if (!this.isCurrent) {
      throw new Error(Z.fmt("Z.State.exit: state %@ is not current", this));
    }

    if (substate) { substate.exit(); }

    this.willExitState();
    this.isCurrent = false;

    return this;
  }

  function exitConcurrent() {
    if (!this.isCurrent) {
      throw new Error(Z.fmt("Z.State.exit: state %@ is not current", this));
    }

    this.substates.values().invoke('exit');
    this.willExitState();
    this.isCurrent = false;

    return this;
  }

  this.def('init', function(name, opts) {
    opts = Z.defaults(opts || {}, {isConcurrent: false});

    this.name         = name;
    this.substates    = Z.H();
    this.superstate   = null;
    this.isConcurrent = opts.isConcurrent;
    this.isCurrent    = false;
    this.path         = [];
  });

  this.def('addSubstate', function(state) {
    this.substates.at(state.name, state);
    state.superstate = this;
    updatePath(state);
    return this;
  });

  this.def('enter', function(paths) {
    return this.isConcurrent ?
      enterConcurrent.call(this, paths) : enterClustered.call(this, paths);
  });

  this.def('exit', function() {
    return this.isConcurrent ?
      exitConcurrent.call(this) : exitClustered.call(this);
  });

  this.def('current', function() {
    var substates = this.substates.values();

    if (!this.isCurrent) { return null; }
    if (substates.size() === 0) { return [this]; }

    return substates.inject([], function(acc, s) {
      if (s.isCurrent) { acc = acc.concat(s.current()); }
      return acc;
    });
  });

  this.def('didEnterState', Z.identity);
  this.def('willExitState', Z.identity);
});
